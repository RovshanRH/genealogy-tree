// test/fixtures.ts

export const mockPerson = {
  id: 'person-1',
  firstname: 'John',
  patronymic: 'Doe',
  surname: 'surname-1',
  maidenSurname: null,
  age: 30,
  gender: 'male',
  marital_status: 'single',
  spouse: null,
  mother: null,
  father: null,
  birth_place: 'birth-1',
  death_place: null,
  nationality: 'nationality-1',
  socialstatus: 'social-1',
  bio: 'Test bio',
  source_info: 'Test source',
  ispersoncontacted: false,
  isalive: true,
  fullname: 'John Doe',
  fulladdress: [],
  cityaddress: [],
  created_at: new Date(),
  updated_at: new Date()
};

export const mockFullPerson = {
  ...mockPerson,
  surname_obj: { id: 'surname-1', name: 'Doe' },
  maiden_surname_obj: null,
  nationality_obj: { id: 'nationality-1', name: 'American' },
  social_status_obj: { id: 'social-1', name: 'Middle Class' },
  mother_obj: {
    id: 'mother-1',
    firstname: 'Mary',
    surname_obj: { name: 'Smith' }
  },
  father_obj: {
    id: 'father-1',
    firstname: 'James',
    surname_obj: { name: 'Doe' }
  },
  spouse_obj: null,
  birth_place_obj: {
    id: 'birth-1',
    country: { name: 'USA' },
    city: { name: 'New York' }
  },
  death_place_obj: null
};

export const mockTree = {
  id: 'tree-1',
  name: 'Family Tree',
  count_all_characters: 0,
  count_all_characters_alive: 0,
  count_all_characters_dead: 0,
  count_all_characters_kids: 0,
  count_all_characters_parents: 0,
  count_all_characters_male: 0,
  count_all_characters_female: 0
};

export const mockOccupation = {
  id: 'occ-1',
  title: 'Engineer',
  organization: 'Google',
  created_at: new Date(),
  updated_at: new Date()
};

export const mockEducation = {
  id: 'edu-1',
  institution: 'MIT',
  degree: 'BS',
  specialty: 'Computer Science',
  created_at: new Date(),
  updated_at: new Date()
};

export const mockResidence = {
  id: 'res-1',
  country_residence_countryTocountry: { id: 'country-1', name: 'USA' },
  city_residence_cityTocity: { id: 'city-1', name: 'New York' },
  street_residence_streetTostreet: { id: 'street-1', name: '5th Ave' },
  house_residence_houseTohouse: { id: 'house-1', name: '10' },
  apartment_residence_apartmentToapartment: { id: 'apt-1', name: '5' }
};