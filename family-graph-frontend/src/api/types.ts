// Типы соответствуют schema.graphql (см. backend проекта).
// Здесь перечислены только поля, которые реально используются фронтендом —
// при необходимости можно расширить любой из инпутов/типов.

export type Gender = "male" | "female";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export interface NamedRef {
  id: string;
  name: string | null;
}

export interface GenealogyTree {
  id: string;
  name: string;
  count_all_characters: number | null;
  count_all_characters_alive: number | null;
  count_all_characters_dead: number | null;
  count_all_characters_kids: number | null;
  count_all_characters_parents: number | null;
  count_all_characters_male: number | null;
  count_all_characters_female: number | null;
}

export interface Person {
  id: string;
  genealogy_tree_id: string | null;
  mother: string | null;
  father: string | null;
  spouse: string | null;
  firstname: string;
  patronymic: string | null;
  fullname: string | null;
  age: number | null;
  gender: Gender | null;
  marital_status: MaritalStatus | null;
  isalive: boolean | null;
  surname_obj: NamedRef | null;
  maidensurname_obj: NamedRef | null;
}

export interface Relation {
  id: string;
  fatherid: string | null;
  motherid: string | null;
  personid: string | null;
  spouseid: string | null;
}

// --- Развёрнутая карточка персонажа -----------------------------------------
// Принципиально НЕ используем query personWithRelations. Вместо этого:
//  1) person(id) — забираем собственные поля персонажа + сырые FK
//     (mother / father / spouse — это просто ID, без вложенных объектов).
//  2) По каждому найденному id отдельным вызовом person(id) подтягиваем
//     короткую карточку матери/отца/супруга (fetchPersonShort).
//  3) "Детей" в схеме нет как обратной связи — ищем их перебором уже
//     загруженного списка persons по совпадению person.mother / person.father
//     с текущим id (см. useGenealogy.ts → buildPersonDetail).
// Итог собирается на клиенте в один JSON-объект PersonDetail.

export interface PersonShort {
  id: string;
  firstname: string;
  patronymic: string | null;
  fullname: string | null;
  gender: Gender | null;
  isalive: boolean | null;
}

export interface GeoPlace {
  id: string;
  birth_date?: string | null;
  birth_date_approx?: boolean | null;
  death_date?: string | null;
  death_date_approx?: boolean | null;
  country: NamedRef | null;
  city: NamedRef | null;
}

// То, что возвращает запрос person(id) сам по себе — без матери/отца/супруга
// (их id есть здесь же как mother/father/spouse, сами записи доставляются
// отдельно).
export interface PersonBase {
  id: string;
  firstname: string;
  patronymic: string | null;
  fullname: string | null;
  age: number | null;
  gender: Gender | null;
  marital_status: MaritalStatus | null;
  isalive: boolean | null;
  bio: string | null;
  source_info: string | null;
  ispersoncontacted: boolean | null;

  mother: string | null;
  father: string | null;
  spouse: string | null;

  genealogy_tree: { id: string; name: string } | null;
  surname_obj: NamedRef | null;
  maidensurname_obj: NamedRef | null;
  nationality_obj: NamedRef | null;
  social_status_obj: { id: string; name: string | null; description: string | null } | null;
  birth_place_obj: GeoPlace | null;
  death_place_obj: GeoPlace | null;
}

// PersonBase + записи, найденные по id (mother_obj/father_obj/spouse_obj)
// + дети, найденные перебором persons. Это и есть то, что показывает PersonPanel.
export interface PersonDetail extends PersonBase {
  mother_obj: PersonShort | null;
  father_obj: PersonShort | null;
  spouse_obj: PersonShort | null;
  children_by_mother: PersonShort[];
  children_by_father: PersonShort[];
}

// --- Инпуты для мутаций -----------------------------------------------------

export interface LookupInput {
  name?: string | null;
}

export interface PlaceInput {
  birth_date?: string | null;
  birth_date_approx?: boolean | null;
  death_date?: string | null;
  death_date_approx?: boolean | null;
  country?: LookupInput | null;
  city?: LookupInput | null;
}

// Поля общие для создания/обновления — заполняются формой PersonForm.
export interface PersonFormPayload {
  firstname?: string | null;
  patronymic?: string | null;
  gender?: Gender | null;
  age?: number | null;
  marital_status?: MaritalStatus | null;

  mother_id?: string | null;
  father_id?: string | null;
  spouse_id?: string | null;

  surname?: LookupInput | null;
  maidensurname?: LookupInput | null;
  nationality?: LookupInput | null;
  social_status?: { name?: string | null; description?: string | null } | null;

  birth_place?: PlaceInput | null;
  death_place?: PlaceInput | null;

  bio?: string | null;
  source_info?: string | null;
  ispersoncontacted?: boolean | null;
}

export interface CreatePersonInput extends PersonFormPayload {
  genealogy_tree_id: string;
  firstname: string;
}

export type UpdatePersonInput = PersonFormPayload;
