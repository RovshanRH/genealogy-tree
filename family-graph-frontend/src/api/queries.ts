import { gqlRequest } from "./client";
import type {
  CreatePersonInput,
  GenealogyTree,
  Person,
  PersonBase,
  PersonShort,
  Relation,
  UpdatePersonInput,
} from "./types";

// ---------------------------------------------------------------------------
// Деревья
// ---------------------------------------------------------------------------

const TREES_QUERY = /* GraphQL */ `
  query Trees {
    trees {
      id
      name
      count_all_characters
      count_all_characters_alive
      count_all_characters_dead
      count_all_characters_kids
      count_all_characters_parents
      count_all_characters_male
      count_all_characters_female
    }
  }
`;

export async function fetchTrees(): Promise<GenealogyTree[]> {
  const data = await gqlRequest<{ trees: GenealogyTree[] }>(TREES_QUERY);
  return data.trees ?? [];
}

const CREATE_TREE_MUTATION = /* GraphQL */ `
  mutation CreateTree($input: GenealogyTreeInput!) {
    createTree(input: $input) {
      id
      name
    }
  }
`;

export async function createTree(name: string): Promise<GenealogyTree> {
  const data = await gqlRequest<{ createTree: GenealogyTree }>(
    CREATE_TREE_MUTATION,
    { input: { name } },
  );
  return data.createTree;
}

// ---------------------------------------------------------------------------
// Персонажи (список для графа — также используется, чтобы найти детей)
// ---------------------------------------------------------------------------

const PERSONS_QUERY = /* GraphQL */ `
  query Persons {
    persons {
      id
      genealogy_tree_id
      mother
      father
      spouse
      firstname
      patronymic
      fullname
      age
      gender
      marital_status
      isalive
      surname_obj {
        id
        name
      }
      maidensurname_obj {
        id
        name
      }
    }
  }
`;

export async function fetchPersons(): Promise<Person[]> {
  const data = await gqlRequest<{ persons: Person[] }>(PERSONS_QUERY);
  return data.persons ?? [];
}

const RELATIONS_QUERY = /* GraphQL */ `
  query Relations {
    relations {
      id
      fatherid
      motherid
      personid
      spouseid
    }
  }
`;

export async function fetchRelations(): Promise<Relation[]> {
  const data = await gqlRequest<{ relations: Relation[] }>(RELATIONS_QUERY);
  return data.relations ?? [];
}

// ---------------------------------------------------------------------------
// Карточка персонажа — НЕ через personWithRelations.
//
// 1) PERSON_BASE_QUERY: person(id) отдаёт собственные поля персонажа и
//    сырые FK matter/father/spouse (просто ID, без вложенных Person).
// 2) По каждому найденному id отдельным запросом PERSON_SHORT_QUERY
//    (тоже person(id)!) подтягиваем короткую карточку — fetchPersonShort.
// 3) Итог собирается в JSON в useGenealogy.ts → buildPersonDetail().
// ---------------------------------------------------------------------------

const PERSON_BASE_QUERY = /* GraphQL */ `
  query PersonBase($id: ID!) {
    person(id: $id) {
      id
      firstname
      patronymic
      fullname
      age
      gender
      marital_status
      isalive
      bio
      source_info
      ispersoncontacted
      mother
      father
      spouse
      genealogy_tree {
        id
        name
      }
      surname_obj {
        id
        name
      }
      maidensurname_obj {
        id
        name
      }
      nationality_obj {
        id
        name
      }
      social_status_obj {
        id
        name
        description
      }
      birth_place_obj {
        id
        birth_date
        birth_date_approx
        country {
          id
          name
        }
        city {
          id
          name
        }
      }
      death_place_obj {
        id
        death_date
        death_date_approx
        country {
          id
          name
        }
        city {
          id
          name
        }
      }
    }
  }
`;

export async function fetchPersonBase(id: string): Promise<PersonBase | null> {
  const data = await gqlRequest<{ person: PersonBase | null }>(
    PERSON_BASE_QUERY,
    { id },
  );
  return data.person;
}

// Короткая карточка — используется для отца/матери/супруга, найденных по id
// из ответа fetchPersonBase. Тоже обычный person(id), без personWithRelations.
const PERSON_SHORT_QUERY = /* GraphQL */ `
  query PersonShort($id: ID!) {
    person(id: $id) {
      id
      firstname
      patronymic
      fullname
      gender
      isalive
    }
  }
`;

export async function fetchPersonShort(
  id: string,
): Promise<PersonShort | null> {
  const data = await gqlRequest<{ person: PersonShort | null }>(
    PERSON_SHORT_QUERY,
    { id },
  );
  return data.person;
}

// ---------------------------------------------------------------------------
// Создание / обновление / удаление персонажа
// ---------------------------------------------------------------------------

const CREATE_PERSON_MUTATION = /* GraphQL */ `
  mutation CreatePerson($input: CreatePersonInput!) {
    createPerson(input: $input) {
      id
    }
  }
`;

export async function createPerson(
  input: CreatePersonInput,
): Promise<{ id: string }> {
  const data = await gqlRequest<{ createPerson: { id: string } }>(
    CREATE_PERSON_MUTATION,
    { input },
  );
  return data.createPerson;
}

const UPDATE_PERSON_MUTATION = /* GraphQL */ `
  mutation UpdatePerson($id: ID!, $input: UpdatePersonInput!) {
    updatePerson(id: $id, input: $input) {
      id
    }
  }
`;

export async function updatePerson(
  id: string,
  input: UpdatePersonInput,
): Promise<{ id: string }> {
  const data = await gqlRequest<{ updatePerson: { id: string } }>(
    UPDATE_PERSON_MUTATION,
    { id, input },
  );
  return data.updatePerson;
}

const DELETE_PERSON_MUTATION = /* GraphQL */ `
  mutation DeletePerson($id: ID!) {
    deletePerson(id: $id) {
      id
    }
  }
`;

export async function deletePerson(id: string): Promise<void> {
  await gqlRequest<{ deletePerson: { id: string } }>(DELETE_PERSON_MUTATION, {
    id,
  });
}
