// resolvers.test.ts

import { resolvers } from './resolvers';
import { prisma } from '../lib/prisma';
import { personDataBuilder } from '../utils/CreatePersonHelpers';


// Мокаем зависимости
jest.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    person: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    genealogy_tree: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    occupation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    education: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    residence: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    person_occupations: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    person_educations: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    person_residentials: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    relations: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    country: { findFirst: jest.fn(), create: jest.fn() },
    region: { findFirst: jest.fn(), create: jest.fn() },
    city: { findFirst: jest.fn(), create: jest.fn() },
    street: { findFirst: jest.fn(), create: jest.fn() },
    house: { findFirst: jest.fn(), create: jest.fn() },
    apartment: { findFirst: jest.fn(), create: jest.fn() },
    surname: { findFirst: jest.fn(), create: jest.fn() },
    maiden_surname: { findFirst: jest.fn(), create: jest.fn() },
    nationality: { findFirst: jest.fn(), create: jest.fn() },
    social_status: { findFirst: jest.fn(), create: jest.fn() },
    birth_place: { findFirst: jest.fn(), create: jest.fn() },
    death_place: { findFirst: jest.fn(), create: jest.fn() },
  }
}));

jest.mock('../utils/CreatePersonHelpers');

// ============================================================================
// Тесты для Query resolvers
// ============================================================================

describe('Query resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trees', () => {
    it('should return all trees', async () => {
      const mockTrees = [
        { id: '1', name: 'Tree 1' },
        { id: '2', name: 'Tree 2' }
      ];
      (prisma.genealogy_tree.findMany as jest.Mock).mockResolvedValue(mockTrees);

      const result = await resolvers.Query.trees();

      expect(prisma.genealogy_tree.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockTrees);
    });

    it('should throw error when findMany fails', async () => {
      (prisma.genealogy_tree.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(resolvers.Query.trees()).rejects.toThrow(
        'Failed to find trees: Database error'
      );
    });
  });

  describe('tree', () => {
    it('should return a tree by id', async () => {
      const mockTree = { id: '1', name: 'Tree 1' };
      (prisma.genealogy_tree.findFirst as jest.Mock).mockResolvedValue(mockTree);

      const result = await resolvers.Query.tree(null, { id: '1' });

      expect(prisma.genealogy_tree.findFirst).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(result).toEqual(mockTree);
    });
  });

  describe('persons', () => {
    it('should return all persons', async () => {
      const mockPersons = [
        { id: '1', firstname: 'John' },
        { id: '2', firstname: 'Jane' }
      ];
      (prisma.person.findMany as jest.Mock).mockResolvedValue(mockPersons);

      const result = await resolvers.Query.persons();

      expect(prisma.person.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockPersons);
    });
  });

  describe('person', () => {
    it('should return a person by id', async () => {
      const mockPerson = { id: '1', firstname: 'John' };
      (prisma.person.findFirst as jest.Mock).mockResolvedValue(mockPerson);

      const result = await resolvers.Query.person(null, { id: '1' });

      expect(prisma.person.findFirst).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(result).toEqual(mockPerson);
    });
  });

  describe('personWithRelations', () => {
    it('should return person with all relations', async () => {
      const mockPerson = {
        id: '1',
        firstname: 'John',
        surname_person_surnameTosurname: { name: 'Doe' },
        person_person_motherToperson: { firstname: 'Mary' },
      };
      (prisma.person.findUnique as jest.Mock).mockResolvedValue(mockPerson);

      const result = await resolvers.Query.personWithRelations(null, { id: '1' });

      expect(prisma.person.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockPerson);
    });
  });

  describe('occupations', () => {
    it('should return all occupations', async () => {
      const mockOccupations = [
        { id: '1', title: 'Engineer' },
        { id: '2', title: 'Doctor' }
      ];
      (prisma.occupation.findMany as jest.Mock).mockResolvedValue(mockOccupations);

      const result = await resolvers.Query.occupations();

      expect(prisma.occupation.findMany).toHaveBeenCalledWith({
        include: { person_occupations: true }
      });
      expect(result).toEqual(mockOccupations);
    });
  });

  describe('person_occupations', () => {
    it('should return occupations for a person', async () => {
      const mockOccupations = [
        { person_id: '1', occupation: { title: 'Engineer' } }
      ];
      (prisma.person_occupations.findMany as jest.Mock).mockResolvedValue(
        mockOccupations
      );

      const result = await resolvers.Query.person_occupations(null, {
        person_id: '1'
      });

      expect(prisma.person_occupations.findMany).toHaveBeenCalledWith({
        where: { person_id: '1' },
        include: { occupation: true, person: true }
      });
      expect(result).toEqual(mockOccupations);
    });
  });
});

// ============================================================================
// Тесты для Mutation resolvers
// ============================================================================

describe('Mutation resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPerson', () => {
    const mockInput = {
      input: {
        firstname: 'John',
        patronymic: 'Doe',
        age: 30,
        gender: 'male',
        surname: { name: 'Smith' },
        birth_place: {
          country: { name: 'USA' },
          city: { name: 'New York' }
        }
      },
      genealogyTreeId: 'tree-1',
      motherId: 'mother-1',
      fatherId: 'father-1'
    };

    const mockCreatedPerson = {
      id: 'person-1',
      firstname: 'John',
      patronymic: 'Doe',
      age: 30,
      gender: 'male',
      surname: 'surname-1',
      mother: 'mother-1',
      father: 'father-1',
      isalive: true,
      genealogy_tree_id: 'tree-1'
    };

    const mockFullPerson = {
      id: 'person-1',
      firstname: 'John',
      surname_obj: { name: 'Smith' },
      mother_obj: { firstname: 'Mary' },
      father_obj: { firstname: 'James' }
    };

    it('should create a person successfully', async () => {
      const mockTx = {
        person: {
          create: jest.fn().mockResolvedValue(mockCreatedPerson),
          update: jest.fn().mockResolvedValue({ ...mockCreatedPerson, fullname: 'John Smith' }),
          findUnique: jest.fn().mockResolvedValue(mockFullPerson)
        },
        surname: { findFirst: jest.fn().mockResolvedValue({ id: 'surname-1', name: 'Smith' }) },
        birth_place: { findFirst: jest.fn().mockResolvedValue({ id: 'birth-1' }) },
        relations: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
        genealogy_tree: { update: jest.fn() },
        person_residentials: { findMany: jest.fn().mockResolvedValue([]) }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      (personDataBuilder as jest.Mock).mockImplementation(() => ({
        buildData: jest.fn().mockResolvedValue({
          firstname: 'John',
          patronymic: 'Doe',
          age: 30,
          gender: 'male',
          surname: 'surname-1',
          birth_place: 'birth-1'
        })
      }));

      const result = await resolvers.Mutation.createPerson(null, mockInput);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should throw error when firstname is missing', async () => {
      const invalidInput = {
        ...mockInput,
        input: { ...mockInput.input, firstname: undefined }
      };

      (personDataBuilder as jest.Mock).mockImplementation(() => ({
        buildData: jest.fn().mockResolvedValue({})
      }));

      await expect(
        resolvers.Mutation.createPerson(null, invalidInput)
      ).rejects.toThrow('Failed to create person: Firstname is required');
    });
  });

  describe('updatePerson', () => {
    const mockOldPerson = {
      id: 'person-1',
      firstname: 'John',
      patronymic: 'Doe',
      age: 30,
      gender: 'male',
      marital_status: 'single',
      spouse: null,
      mother: null,
      father: null,
      death_place: null,
      isalive: true,
      genealogy_tree_id: 'tree-1'
    };

    const mockUpdatedPerson = {
      ...mockOldPerson,
      firstname: 'John Updated',
      surname: 'surname-2'
    };

    const mockArgs = {
      id: 'person-1',
      input: {
        firstname: 'John Updated',
        surname: { name: 'Johnson' },
        mother_id: 'mother-2',
        father_id: null
      }
    };

    it('should update a person successfully', async () => {
      const mockTx = {
        person: {
          findUnique: jest.fn().mockResolvedValue(mockOldPerson),
          update: jest.fn()
            .mockResolvedValueOnce(mockUpdatedPerson)
            .mockResolvedValueOnce({ ...mockUpdatedPerson, fullname: 'John Johnson' }),
          findUnique: jest.fn().mockResolvedValue({
            id: 'person-1',
            firstname: 'John Updated',
            surname_obj: { name: 'Johnson' }
          })
        },
        relations: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
        genealogy_tree: { findUnique: jest.fn().mockResolvedValue({ id: 'tree-1' }), update: jest.fn() },
        person_residentials: { findMany: jest.fn().mockResolvedValue([]) },
        surname: { findFirst: jest.fn().mockResolvedValue({ id: 'surname-2', name: 'Johnson' }) }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      (personDataBuilder as jest.Mock).mockImplementation(() => ({
        buildData: jest.fn().mockResolvedValue({
          firstname: 'John Updated',
          surname: 'surname-2'
        })
      }));

      const result = await resolvers.Mutation.updatePerson(null, mockArgs);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should throw error when person not found', async () => {
      const mockTx = {
        person: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      await expect(
        resolvers.Mutation.updatePerson(null, mockArgs)
      ).rejects.toThrow('Failed to update person: Person not found');
    });

    it('should handle marital status validation', async () => {
      const argsWithMarital = {
        ...mockArgs,
        input: {
          ...mockArgs.input,
          marital_status: 'married',
          spouse_id: 'spouse-1'
        }
      };

      const mockTx = {
        person: {
          findUnique: jest.fn().mockResolvedValue(mockOldPerson),
          update: jest.fn()
            .mockResolvedValueOnce({ ...mockUpdatedPerson, marital_status: 'married', spouse: 'spouse-1' })
            .mockResolvedValueOnce({ ...mockUpdatedPerson, fullname: 'John Johnson' }),
          findUnique: jest.fn().mockResolvedValue({
            id: 'person-1',
            firstname: 'John Updated'
          })
        },
        relations: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
        genealogy_tree: { findUnique: jest.fn().mockResolvedValue({ id: 'tree-1' }), update: jest.fn() },
        person_residentials: { findMany: jest.fn().mockResolvedValue([]) },
        surname: { findFirst: jest.fn().mockResolvedValue({ id: 'surname-2', name: 'Johnson' }) }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      (personDataBuilder as jest.Mock).mockImplementation(() => ({
        buildData: jest.fn().mockResolvedValue({
          firstname: 'John Updated',
          surname: 'surname-2'
        })
      }));

      const result = await resolvers.Mutation.updatePerson(null, argsWithMarital);

      expect(result).toBeTruthy();
    });
  });

  describe('deletePerson', () => {
    const mockPerson = {
      id: 'person-1',
      firstname: 'John',
      isalive: true,
      gender: 'male',
      mother: null,
      father: null,
      genealogy_tree_id: 'tree-1'
    };

    it('should delete a person successfully', async () => {
      const mockTx = {
        person: {
          findUnique: jest.fn().mockResolvedValue(mockPerson),
          delete: jest.fn().mockResolvedValue(mockPerson)
        },
        relations: { deleteMany: jest.fn() },
        genealogy_tree: { update: jest.fn() }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      const result = await resolvers.Mutation.deletePerson(null, { id: 'person-1' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockPerson);
    });

    it('should throw error when person not found', async () => {
      const mockTx = {
        person: {
          findUnique: jest.fn().mockResolvedValue(null)
        }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      await expect(
        resolvers.Mutation.deletePerson(null, { id: 'person-1' })
      ).rejects.toThrow('Failed to delete person: Person not found');
    });
  });

  describe('createTree', () => {
    it('should create a tree successfully', async () => {
      const mockTree = { id: 'tree-1', name: 'My Tree' };
      (prisma.genealogy_tree.create as jest.Mock).mockResolvedValue(mockTree);

      const result = await resolvers.Mutation.createTree(null, {
        input: { name: 'My Tree' }
      });

      expect(prisma.genealogy_tree.create).toHaveBeenCalledWith({
        data: { name: 'My Tree' }
      });
      expect(result).toEqual(mockTree);
    });
  });

  describe('updateTree', () => {
    it('should update a tree successfully', async () => {
      const mockTree = { id: 'tree-1', name: 'Updated Tree' };
      (prisma.genealogy_tree.update as jest.Mock).mockResolvedValue(mockTree);

      const result = await resolvers.Mutation.updateTree(null, {
        id: 'tree-1',
        input: { name: 'Updated Tree' }
      });

      expect(prisma.genealogy_tree.update).toHaveBeenCalledWith({
        where: { id: 'tree-1' },
        data: { name: 'Updated Tree' }
      });
      expect(result).toEqual(mockTree);
    });
  });

  describe('deleteTree', () => {
    it('should delete a tree successfully', async () => {
      (prisma.genealogy_tree.delete as jest.Mock).mockResolvedValue({ id: 'tree-1' });

      const result = await resolvers.Mutation.deleteTree(null, { id: 'tree-1' });

      expect(prisma.genealogy_tree.delete).toHaveBeenCalledWith({
        where: { id: 'tree-1' }
      });
      expect(result).toBe(true);
    });
  });

  describe('createOccupation', () => {
    it('should create an occupation successfully', async () => {
      const mockOccupation = { id: 'occ-1', title: 'Engineer', organization: 'Google' };
      (prisma.occupation.create as jest.Mock).mockResolvedValue(mockOccupation);

      const result = await resolvers.Mutation.createOccupation(null, {
        input: { title: 'Engineer', organization: 'Google' }
      });

      expect(prisma.occupation.create).toHaveBeenCalledWith({
        data: { title: 'Engineer', organization: 'Google' },
        include: { person_occupations: true }
      });
      expect(result).toEqual(mockOccupation);
    });
  });

  describe('updateOccupation', () => {
    it('should update an occupation successfully', async () => {
      const mockOccupation = { id: 'occ-1', title: 'Senior Engineer', organization: 'Google' };
      (prisma.occupation.update as jest.Mock).mockResolvedValue(mockOccupation);

      const result = await resolvers.Mutation.updateOccupation(null, {
        id: 'occ-1',
        input: { title: 'Senior Engineer', organization: 'Google' }
      });

      expect(prisma.occupation.update).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        data: { title: 'Senior Engineer', organization: 'Google' }
      });
      expect(result).toEqual(mockOccupation);
    });
  });

  describe('addPersonOccupation', () => {
    it('should add an occupation to a person', async () => {
      const mockPersonOccupation = {
        id: 'po-1',
        person_id: 'person-1',
        occupation_id: 'occ-1',
        start_date: new Date('2020-01-01'),
        is_primary: true
      };
      (prisma.person_occupations.create as jest.Mock).mockResolvedValue(
        mockPersonOccupation
      );

      const result = await resolvers.Mutation.addPersonOccupation(null, {
        input: {
          personId: 'person-1',
          occupationId: 'occ-1',
          startDate: '2020-01-01',
          isPrimary: true
        }
      });

      expect(prisma.person_occupations.create).toHaveBeenCalledWith({
        data: {
          person_id: 'person-1',
          occupation_id: 'occ-1',
          start_date: expect.any(Date),
          end_date: null,
          is_primary: true
        },
        include: { person: true, occupation: true }
      });
      expect(result).toEqual(mockPersonOccupation);
    });
  });

  describe('createEducation', () => {
    it('should create an education successfully', async () => {
      const mockEducation = {
        id: 'edu-1',
        institution: 'MIT',
        degree: 'BS',
        specialty: 'Computer Science'
      };
      (prisma.education.create as jest.Mock).mockResolvedValue(mockEducation);

      const result = await resolvers.Mutation.createEducation(null, {
        input: {
          institution: 'MIT',
          degree: 'BS',
          specialty: 'Computer Science'
        }
      });

      expect(prisma.education.create).toHaveBeenCalledWith({
        data: {
          institution: 'MIT',
          degree: 'BS',
          specialty: 'Computer Science'
        }
      });
      expect(result).toEqual(mockEducation);
    });
  });

  describe('createResidence', () => {
    const mockGeo = {
      country: { id: 'country-1', name: 'USA' },
      city: { id: 'city-1', name: 'New York' },
      street: { id: 'street-1', name: '5th Ave' },
      house: { id: 'house-1', name: '10' },
      apartment: { id: 'apt-1', name: '5' }
    };

    it('should create a residence successfully', async () => {
      const mockResidence = {
        id: 'res-1',
        country_residence_countryTocountry: { name: 'USA' },
        city_residence_cityTocity: { name: 'New York' }
      };

      const mockTx = {
        residence: {
          create: jest.fn().mockResolvedValue(mockResidence),
          findUnique: jest.fn().mockResolvedValue(mockResidence)
        }
      };

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => callback(mockTx)
      );

      (personDataBuilder as jest.Mock).mockImplementation(() => ({
        createOrFindResidenceGeo: jest.fn().mockResolvedValue(mockGeo)
      }));

      const result = await resolvers.Mutation.createResidence(null, {
        input: {
          country: { name: 'USA' },
          city: { name: 'New York' }
        }
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockResidence);
    });
  });

  describe('addPersonResidence', () => {
    it('should add a residence to a person', async () => {
      const mockPersonResidence = {
        id: 'pr-1',
        person_id: 'person-1',
        residence_id: 'res-1',
        start_date: new Date('2020-01-01'),
        is_current: true
      };
      (prisma.person_residentials.create as jest.Mock).mockResolvedValue(
        mockPersonResidence
      );

      const result = await resolvers.Mutation.addPersonResidence(null, {
        input: {
          personId: 'person-1',
          residenceId: 'res-1',
          startDate: '2020-01-01',
          isCurrent: true
        }
      });

      expect(prisma.person_residentials.create).toHaveBeenCalledWith({
        data: {
          person_id: 'person-1',
          residence_id: 'res-1',
          start_date: expect.any(Date),
          end_date: null,
          start_date_approx: false,
          end_date_approx: false,
          is_current: true
        },
        include: {
          person: true,
          residence: {
            include: {
              country_residence_countryTocountry: true,
              city_residence_cityTocity: { include: { region: true } },
              street_residence_streetTostreet: true,
              house_residence_houseTohouse: true,
              apartment_residence_apartmentToapartment: true
            }
          }
        }
      });
      expect(result).toEqual(mockPersonResidence);
    });
  });
});

// ============================================================================
// Интеграционные тесты для вспомогательных функций
// ============================================================================

describe('Helper functions', () => {
  describe('computeIsAlive', () => {
    it('should return true when deathPlaceId is null', () => {
      const result = (resolvers as any).computeIsAlive(null);
      expect(result).toBe(true);
    });

    it('should return false when deathPlaceId is not null', () => {
      const result = (resolvers as any).computeIsAlive('death-1');
      expect(result).toBe(false);
    });
  });

  describe('buildFullName', () => {
    it('should build full name correctly', () => {
      const result = (resolvers as any).buildFullName(
        'John',
        'Doe',
        'Smith'
      );
      expect(result).toBe('Doe John Smith');
    });

    it('should handle missing parts', () => {
      const result = (resolvers as any).buildFullName(
        'John',
        null,
        null
      );
      expect(result).toBe('John');
    });
  });

  describe('checkMaritalStatus', () => {
    it('should not throw when status is compatible', () => {
      expect(() => {
        (resolvers as any).checkMaritalStatus('spouse-1', 'married');
      }).not.toThrow();
    });

    it('should throw when spouse is provided but status is single', () => {
      expect(() => {
        (resolvers as any).checkMaritalStatus('spouse-1', 'single');
      }).toThrow('Супруг указан, но семейный статус "single" несовместим с наличием супруга');
    });

    it('should throw when spouse is null but status is married', () => {
      expect(() => {
        (resolvers as any).checkMaritalStatus(null, 'married');
      }).toThrow('Супруг не указан, но семейный статус "married" требует наличия супруга');
    });
  });
});

// ============================================================================
// Тесты для Residence resolver
// ============================================================================

describe('Residence resolver', () => {
  it('should resolve country from parent', () => {
    const parent = {
      country_residence_countryTocountry: { id: 'country-1', name: 'USA' }
    };
    const result = resolvers.Residence.country(parent);
    expect(result).toEqual({ id: 'country-1', name: 'USA' });
  });

  it('should resolve city from parent', () => {
    const parent = {
      city_residence_cityTocity: { id: 'city-1', name: 'New York' }
    };
    const result = resolvers.Residence.city(parent);
    expect(result).toEqual({ id: 'city-1', name: 'New York' });
  });

  it('should resolve street from parent', () => {
    const parent = {
      street_residence_streetTostreet: { id: 'street-1', name: '5th Ave' }
    };
    const result = resolvers.Residence.street(parent);
    expect(result).toEqual({ id: 'street-1', name: '5th Ave' });
  });

  it('should resolve house from parent', () => {
    const parent = {
      house_residence_houseTohouse: { id: 'house-1', name: '10' }
    };
    const result = resolvers.Residence.house(parent);
    expect(result).toEqual({ id: 'house-1', name: '10' });
  });

  it('should resolve apartment from parent', () => {
    const parent = {
      apartment_residence_apartmentToapartment: { id: 'apt-1', name: '5' }
    };
    const result = resolvers.Residence.apartment(parent);
    expect(result).toEqual({ id: 'apt-1', name: '5' });
  });
});