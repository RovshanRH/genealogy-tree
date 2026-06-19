import { computed, ref } from "vue";
import {
  createPerson as apiCreatePerson,
  createTree as apiCreateTree,
  deletePerson as apiDeletePerson,
  fetchPersonBase,
  fetchPersonShort,
  fetchPersons,
  fetchRelations,
  fetchTrees,
  updatePerson as apiUpdatePerson,
} from "../api/queries";
import type {
  CreatePersonInput,
  GenealogyTree,
  Person,
  PersonDetail,
  PersonShort,
  Relation,
  UpdatePersonInput,
} from "../api/types";

export interface GraphNode {
  name: string;
  gender: "male" | "female" | null;
  isalive: boolean | null;
  [key: string]: unknown;
}

export type EdgeType = "father" | "mother" | "spouse";

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  [key: string]: unknown;
}

export interface NodePosition {
  x: number;
  y: number;
}

const H_SPACING = 150;
const V_SPACING = 150;

/**
 * Простая генеалогическая раскладка: уровень поколения вычисляется по
 * глубине родительских связей (BFS/рекурсия с защитой от циклов),
 * супруги принудительно ставятся на один уровень и располагаются рядом.
 * Это не силовая раскладка (force layout) — для семейного дерева
 * раскладка "по поколениям" читается гораздо понятнее.
 */
function computeGenerationalLayout(
  nodeIds: string[],
  relations: Relation[],
): Record<string, NodePosition> {
  const idSet = new Set(nodeIds);
  const parentsOf = new Map<string, Set<string>>();
  const spouseOf = new Map<string, string>();

  for (const r of relations) {
    if (!r.personid || !idSet.has(r.personid)) continue;
    if (r.fatherid && idSet.has(r.fatherid)) {
      if (!parentsOf.has(r.personid)) parentsOf.set(r.personid, new Set());
      parentsOf.get(r.personid)!.add(r.fatherid);
    }
    if (r.motherid && idSet.has(r.motherid)) {
      if (!parentsOf.has(r.personid)) parentsOf.set(r.personid, new Set());
      parentsOf.get(r.personid)!.add(r.motherid);
    }
    if (r.spouseid && idSet.has(r.spouseid)) {
      spouseOf.set(r.personid, r.spouseid);
      spouseOf.set(r.spouseid, r.personid);
    }
  }

  const level = new Map<string, number>();
  const visiting = new Set<string>();

  function getLevel(id: string): number {
    if (level.has(id)) return level.get(id)!;
    if (visiting.has(id)) return 0; // защита от циклов в данных
    visiting.add(id);
    const parents = parentsOf.get(id);
    let lvl = 0;
    if (parents && parents.size > 0) {
      lvl = Math.max(...Array.from(parents).map((p) => getLevel(p) + 1));
    }
    visiting.delete(id);
    level.set(id, lvl);
    return lvl;
  }

  nodeIds.forEach(getLevel);

  // Супругов выравниваем на один уровень (берём больший)
  for (const [a, b] of spouseOf.entries()) {
    const lvl = Math.max(level.get(a) ?? 0, level.get(b) ?? 0);
    level.set(a, lvl);
    level.set(b, lvl);
  }

  const byLevel = new Map<number, string[]>();
  for (const id of nodeIds) {
    const lvl = level.get(id) ?? 0;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(id);
  }

  const positions: Record<string, NodePosition> = {};
  const sortedLevels = Array.from(byLevel.keys()).sort((a, b) => a - b);

  for (const lvl of sortedLevels) {
    const ids = byLevel.get(lvl)!;
    const ordered: string[] = [];
    const used = new Set<string>();
    for (const id of ids) {
      if (used.has(id)) continue;
      ordered.push(id);
      used.add(id);
      const sp = spouseOf.get(id);
      if (sp && ids.includes(sp) && !used.has(sp)) {
        ordered.push(sp);
        used.add(sp);
      }
    }
    ordered.forEach((id, i) => {
      positions[id] = { x: i * H_SPACING, y: lvl * V_SPACING };
    });
  }

  return positions;
}

// ---------------------------------------------------------------------------
// Списочное (древовидное) представление дерева
// ---------------------------------------------------------------------------

export interface FamilyTreeNode {
  person: Person;
  spouse: Person | null;
  children: FamilyTreeNode[];
}

/**
 * Строит вложенную структуру для списочного отображения дерева.
 * Ребёнок привязывается ровно к одному "стволу" (предпочитаем отца, если он
 * есть в наборе, иначе мать) — иначе он показывался бы дважды, под обоими
 * родителями. Супруг показывается рядом с человеком, а не как отдельная
 * ветка, поэтому при наличии супруга-"корня" (без своих родителей в наборе)
 * он не выводится повторно отдельным элементом верхнего уровня.
 */
function buildFamilyTree(persons: Person[]): FamilyTreeNode[] {
  const byId = new Map(persons.map((p) => [p.id, p]));
  const childrenOf = new Map<string, Person[]>();

  for (const p of persons) {
    const parentId =
      p.father && byId.has(p.father)
        ? p.father
        : p.mother && byId.has(p.mother)
          ? p.mother
          : null;
    if (parentId) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId)!.push(p);
    }
  }

  const hasParentInSet = new Set(
    persons
      .filter(
        (p) =>
          (p.father && byId.has(p.father)) || (p.mother && byId.has(p.mother)),
      )
      .map((p) => p.id),
  );
  const roots = persons.filter((p) => !hasParentInSet.has(p.id));

  function byName(list: Person[]): Person[] {
    return [...list].sort((a, b) =>
      (a.fullname || a.firstname).localeCompare(
        b.fullname || b.firstname,
        "ru",
      ),
    );
  }

  const visited = new Set<string>();

  function build(p: Person): FamilyTreeNode {
    visited.add(p.id);
    let spouse: Person | null = null;
    if (p.spouse && byId.has(p.spouse) && !visited.has(p.spouse)) {
      spouse = byId.get(p.spouse) ?? null;
      if (spouse) visited.add(spouse.id);
    }
    const kids = byName(childrenOf.get(p.id) ?? []).filter(
      (k) => !visited.has(k.id),
    );
    return { person: p, spouse, children: kids.map(build) };
  }

  const result: FamilyTreeNode[] = [];
  for (const root of byName(roots)) {
    if (visited.has(root.id)) continue; // уже показан как супруг другого корня
    result.push(build(root));
  }
  return result;
}

export function useGenealogy() {
  const trees = ref<GenealogyTree[]>([]);
  const selectedTreeId = ref<string | null>(null);

  const persons = ref<Person[]>([]);
  const relations = ref<Relation[]>([]);

  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedPersonId = ref<string | null>(null);
  const selectedPersonDetail = ref<PersonDetail | null>(null);
  const detailLoading = ref(false);

  const filteredPersons = computed<Person[]>(() => {
    if (!selectedTreeId.value) return persons.value;
    return persons.value.filter(
      (p) => p.genealogy_tree_id === selectedTreeId.value,
    );
  });

  const filteredPersonIds = computed<string[]>(() =>
    filteredPersons.value.map((p) => p.id),
  );

  const nodes = computed<Record<string, GraphNode>>(() => {
    const result: Record<string, GraphNode> = {};
    for (const p of filteredPersons.value) {
      result[p.id] = {
        name: p.fullname?.trim() || p.firstname,
        gender: p.gender,
        isalive: p.isalive,
      };
    }
    return result;
  });

  const edges = computed<Record<string, GraphEdge>>(() => {
    const idSet = new Set(filteredPersonIds.value);
    const result: Record<string, GraphEdge> = {};
    const seenSpouse = new Set<string>();

    for (const r of relations.value) {
      if (!r.personid || !idSet.has(r.personid)) continue;

      if (r.fatherid && idSet.has(r.fatherid)) {
        result[`father-${r.fatherid}-${r.personid}`] = {
          source: r.fatherid,
          target: r.personid,
          type: "father",
        };
      }
      if (r.motherid && idSet.has(r.motherid)) {
        result[`mother-${r.motherid}-${r.personid}`] = {
          source: r.motherid,
          target: r.personid,
          type: "mother",
        };
      }
      if (r.spouseid && idSet.has(r.spouseid)) {
        const key = [r.personid, r.spouseid].sort().join("|");
        if (!seenSpouse.has(key)) {
          seenSpouse.add(key);
          result[`spouse-${key}`] = {
            source: r.personid,
            target: r.spouseid,
            type: "spouse",
          };
        }
      }
    }
    return result;
  });

  const layouts = computed(() => ({
    nodes: computeGenerationalLayout(filteredPersonIds.value, relations.value),
  }));

  const familyTree = computed<FamilyTreeNode[]>(() =>
    buildFamilyTree(filteredPersons.value),
  );

  async function loadAll() {
    loading.value = true;
    error.value = null;
    try {
      const [treesData, personsData, relationsData] = await Promise.all([
        fetchTrees(),
        fetchPersons(),
        fetchRelations(),
      ]);
      trees.value = treesData;
      persons.value = personsData;
      relations.value = relationsData;
      if (!selectedTreeId.value && treesData.length > 0) {
        selectedTreeId.value = treesData[0].id;
      }
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Person(id) не возвращает детей — в схеме нет такой обратной связи.
   * Ищем их сами среди уже загруженных persons по полям mother/father,
   * указывающим на этого человека (раздельно, как и просили: "по найденным
   * id ищи остальные записи" — здесь id текущего человека ищется среди
   * чужих mother/father).
   */
  function computeChildren(personId: string): {
    byMother: PersonShort[];
    byFather: PersonShort[];
  } {
    const toShort = (p: Person): PersonShort => ({
      id: p.id,
      firstname: p.firstname,
      patronymic: p.patronymic,
      fullname: p.fullname,
      gender: p.gender,
      isalive: p.isalive,
    });
    const byName = (list: PersonShort[]) =>
      list.sort((a, b) =>
        (a.fullname || a.firstname).localeCompare(
          b.fullname || b.firstname,
          "ru",
        ),
      );
    return {
      byMother: byName(
        persons.value.filter((p) => p.mother === personId).map(toShort),
      ),
      byFather: byName(
        persons.value.filter((p) => p.father === personId).map(toShort),
      ),
    };
  }

  /**
   * Собирает карточку человека НЕ через personWithRelations:
   *  1. person(id) — fetchPersonBase — собственные поля + сырые id mother/father/spouse.
   *  2. По каждому найденному id отдельным person(id) (fetchPersonShort)
   *     достаём короткую запись матери/отца/супруга.
   *  3. Дети ищутся переборкой уже загруженных persons (см. computeChildren).
   * Результат — единый JSON-объект PersonDetail.
   */
  async function buildPersonDetail(id: string): Promise<PersonDetail | null> {
    const base = await fetchPersonBase(id);
    if (!base) return null;

    const [motherObj, fatherObj, spouseObj] = await Promise.all([
      base.mother ? fetchPersonShort(base.mother) : Promise.resolve(null),
      base.father ? fetchPersonShort(base.father) : Promise.resolve(null),
      base.spouse ? fetchPersonShort(base.spouse) : Promise.resolve(null),
    ]);

    const { byMother, byFather } = computeChildren(id);

    return {
      ...base,
      mother_obj: motherObj,
      father_obj: fatherObj,
      spouse_obj: spouseObj,
      children_by_mother: byMother,
      children_by_father: byFather,
    };
  }

  async function selectPerson(id: string | null) {
    selectedPersonId.value = id;
    selectedPersonDetail.value = null;
    if (!id) return;
    detailLoading.value = true;
    error.value = null;
    try {
      selectedPersonDetail.value = await buildPersonDetail(id);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      detailLoading.value = false;
    }
  }

  async function refreshSelectedPerson() {
    if (selectedPersonId.value) await selectPerson(selectedPersonId.value);
  }

  async function addTree(name: string) {
    const tree = await apiCreateTree(name);
    trees.value = [...trees.value, tree];
    selectedTreeId.value = tree.id;
    return tree;
  }

  async function submitCreatePerson(input: CreatePersonInput) {
    const created = await apiCreatePerson(input);
    await loadAll();
    await selectPerson(created.id);
    return created;
  }

  async function submitUpdatePerson(id: string, input: UpdatePersonInput) {
    const updated = await apiUpdatePerson(id, input);
    await loadAll();
    await selectPerson(updated.id);
    return updated;
  }

  async function removePerson(id: string) {
    await apiDeletePerson(id);
    if (selectedPersonId.value === id) {
      selectedPersonId.value = null;
      selectedPersonDetail.value = null;
    }
    await loadAll();
  }

  return {
    trees,
    selectedTreeId,
    persons,
    filteredPersons,
    relations,
    nodes,
    edges,
    layouts,
    familyTree,
    loading,
    error,
    selectedPersonId,
    selectedPersonDetail,
    detailLoading,
    loadAll,
    selectPerson,
    refreshSelectedPerson,
    addTree,
    submitCreatePerson,
    submitUpdatePerson,
    removePerson,
  };
}
