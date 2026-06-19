// import { street } from '../generated/prisma/models/street';
// import { birth_place } from '../generated/prisma/models/birth_place';
// import { death_place } from '../generated/prisma/models/death_place';

import { HelpUtils } from "./HelpUtils.ts";
// import { HelpUtils } from './HelpUtils';

// Класс с методами для создания записей для дальнейшего связывания с персонажем

const normalizeText = new HelpUtils().normalizeText;
// const validateNull = new HelpUtils().validateNull;

type LookupInput = {
  value?: string | null;
  name?: string | null;
  description?: string | null;
  birth_date?: string | null;
  birth_date_approx?: boolean | null;
  death_date?: string | null;
  death_date_approx?: boolean | null;
  country?: LookupInput | null;
  region?: LookupInput | null;
  city?: LookupInput | null;
  street?: LookupInput | null;
  house?: LookupInput | null;
  apartment?: LookupInput | null;
};

type CreatePersonArgsInput = {
  surname?: LookupInput | null;
  maidensurname?: LookupInput | null;
  firstname?: string | null;
  patronymic?: string | null;
  gender?: "male" | "female" | null;
  age?: number | null;
  marital_status?: string | null;
  birth_place?: LookupInput | null;
  death_place?: LookupInput | null;
  nationality?: LookupInput | null;
  social_status?: LookupInput | null;
  bio?: string | null;
  source_info?: string | null;
  ispersoncontacted?: boolean | null;
  isalive?: boolean | null;
};

export class personDataBuilder {
  async createOrFindResidenceGeo(tx: any, input: any) {
    console.log("[createOrFindResidenceGeo] START", input);

    return {
      country: await this.createOrFindCountry(tx, input?.country),
      city: await this.createOrFindCity(tx, input?.city),
      street: await this.createOrFindStreet(tx, input?.street),
      house: await this.createOrFindHouse(tx, input?.house),
      apartment: await this.createOrFindApartment(tx, input?.apartment),
    };
  }
  async createOrFindSurname(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindSurname] START", { input });

    if (input?.name == null) {
      console.log("[createOrFindSurname] Input name is null, returning null");
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindSurname] Normalized name:", name);

    try {
      const surname =
        (await tx.surname.findFirst({
          where: { name: name },
        })) ??
        (await tx.surname.create({
          data: {
            name: name,
          },
        }));

      console.log("[createOrFindSurname] SUCCESS", {
        surnameId: surname?.id,
        name: surname?.name,
      });
      return surname;
    } catch (error) {
      console.error("[createOrFindSurname] ERROR:", error);
      throw error;
    }
  }

  async createOrFindMaidenSurname(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindMaidenSurname] START", { input });

    if (input?.name == null) {
      console.log(
        "[createOrFindMaidenSurname] Input name is null, returning null",
      );
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindMaidenSurname] Normalized name:", name);

    try {
      const maidensurname =
        (await tx.maiden_surname.findFirst({
          where: { name: name },
        })) ??
        (await tx.maiden_surname.create({
          data: {
            name: name,
          },
        }));

      console.log("[createOrFindMaidenSurname] SUCCESS", {
        maidenSurnameId: maidensurname?.id,
        name: maidensurname?.name,
      });
      return maidensurname;
    } catch (error) {
      console.error("[createOrFindMaidenSurname] ERROR:", error);
      throw error;
    }
  }

  async createOrFindNationality(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindNationality] START", { input });

    if (input?.name == null) {
      console.log(
        "[createOrFindNationality] Input name is null, returning null",
      );
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindNationality] Normalized name:", name);

    try {
      const nationality =
        (await tx.nationality.findFirst({
          where: { name: name },
        })) ??
        (await tx.nationality.create({
          data: { name: name },
        }));

      console.log("[createOrFindNationality] SUCCESS", {
        nationalityId: nationality?.id,
        name: nationality?.name,
      });
      return nationality;
    } catch (error) {
      console.error("[createOrFindNationality] ERROR:", error);
      throw error;
    }
  }

  async createOrFindSocialStatus(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindSocialStatus] START", { input });

    if (input?.name == null) {
      console.log(
        "[createOrFindSocialStatus] Input name is null, returning null",
      );
      return null;
    }

    const name = normalizeText(input?.name);
    const description = normalizeText(input?.description);
    console.log(
      "[createOrFindSocialStatus] Normalized name:",
      name,
      "description:",
      description,
    );

    try {
      const socialstatus =
        (await tx.social_status.findFirst({ where: { name: name } })) ??
        (await tx.social_status.create({
          data: { name: name, description: description ?? "" },
        }));

      console.log("[createOrFindSocialStatus] SUCCESS", {
        socialStatusId: socialstatus?.id,
        name: socialstatus?.name,
      });
      return socialstatus;
    } catch (error) {
      console.error("[createOrFindSocialStatus] ERROR:", error);
      throw error;
    }
  }

  async createOrFindCountry(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindCountry] START", { input });

    if (!input?.name) return null;

    const name = normalizeText(input.name);

    try {
      const country =
        (await tx.country.findFirst({ where: { name } })) ??
        (await tx.country.create({ data: { name } }));

      console.log("[createOrFindCountry] SUCCESS", {
        countryId: country.id,
        name,
      });
      return country;
    } catch (error) {
      console.error("[createOrFindCountry] ERROR:", error);
      throw error;
    }
  }

  async createOrFindRegion(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindRegion] START", { input });

    if (input?.name == null) {
      console.log("[createOrFindRegion] Input name is null, returning null");
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindRegion] Normalized name:", name);

    console.log("[createOrFindRegion] Creating/finding country...");
    const country = await this.createOrFindCountry(tx, input?.country);
    console.log(
      "[createOrFindRegion] Country result:",
      country ? { id: country.id, name: country.name } : null,
    );

    try {
      const region =
        (await tx.region.findFirst({
          where: { name: name, country_id: country?.id },
        })) ??
        (await tx.region.create({
          data: {
            name: name,
            ...(country ? { country: { connect: { id: country.id } } } : {}),
          },
        }));

      console.log("[createOrFindRegion] SUCCESS", {
        regionId: region?.id,
        name: region?.name,
        countryId: region?.country_id,
      });
      return region;
    } catch (error) {
      console.error("[createOrFindRegion] ERROR:", error);
      throw error;
    }
  }

  async createOrFindCity(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindCity] START", { input });

    if (input?.name == null) {
      console.log("[createOrFindCity] Input name is null, returning null");
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindCity] Normalized name:", name);

    console.log("[createOrFindCity] Creating/finding region...");
    const region = await this.createOrFindRegion(tx, input?.region);
    console.log(
      "[createOrFindCity] Region result:",
      region ? { id: region.id, name: region.name } : null,
    );

    try {
      const city =
        (await tx.city.findFirst({
          where: { name: name, region_id: region?.id },
        })) ??
        (await tx.city.create({
          data: {
            name: name,
            ...(region ? { region: { connect: { id: region.id } } } : {}),
          },
        }));

      console.log("[createOrFindCity] SUCCESS", {
        cityId: city?.id,
        name: city?.name,
        regionId: city?.region_id,
      });
      return city;
    } catch (error) {
      console.error("[createOrFindCity] ERROR:", error);
      throw error;
    }
  }

  async createOrFindStreet(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindStreet] START", { input });

    if (input?.name == null) {
      console.log("[createOrFindStreet] Input name is null, returning null");
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindStreet] Normalized name:", name);

    console.log("[createOrFindStreet] Creating/finding city...");
    const city = await this.createOrFindCity(tx, input?.city);
    console.log(
      "[createOrFindStreet] City result:",
      city ? { id: city.id, name: city.name } : null,
    );

    try {
      const street =
        (await tx.street.findFirst({
          where: { name: name, city_id: city?.id },
        })) ??
        (await tx.street.create({
          data: {
            name: name,
            ...(city ? { city: { connect: { id: city.id } } } : {}),
          },
        }));

      console.log("[createOrFindStreet] SUCCESS", {
        streetId: street?.id,
        name: street?.name,
        cityId: street?.city_id,
      });
      return street;
    } catch (error) {
      console.error("[createOrFindStreet] ERROR:", error);
      throw error;
    }
  }

  async createOrFindHouse(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindHouse] START", { input });

    if (input?.name == null) {
      console.log("[createOrFindHouse] Input name is null, returning null");
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindHouse] Normalized name:", name);

    console.log("[createOrFindHouse] Creating/finding street...");
    const street = await this.createOrFindStreet(tx, input?.street);
    console.log(
      "[createOrFindHouse] Street result:",
      street ? { id: street.id, name: street.name } : null,
    );

    try {
      const house =
        (await tx.house.findFirst({
          where: { name: name, street_id: street?.id },
        })) ??
        (await tx.house.create({
          data: {
            name: name,
            ...(street ? { street: { connect: { id: street.id } } } : {}),
          },
        }));

      console.log("[createOrFindHouse] SUCCESS", {
        houseId: house?.id,
        name: house?.name,
        streetId: house?.street_id,
      });
      return house;
    } catch (error) {
      console.error("[createOrFindHouse] ERROR:", error);
      throw error;
    }
  }

  async createOrFindApartment(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindApartment] START", { input });

    if (input?.name == null) {
      console.log("[createOrFindApartment] Input name is null, returning null");
      return null;
    }

    const name = normalizeText(input?.name);
    console.log("[createOrFindApartment] Normalized name:", name);

    console.log("[createOrFindApartment] Creating/finding house...");
    const house = await this.createOrFindHouse(tx, input?.house);
    console.log(
      "[createOrFindApartment] House result:",
      house ? { id: house.id, name: house.name } : null,
    );

    try {
      const apartment =
        (await tx.apartment.findFirst({
          where: { name: name, house_id: house?.id },
        })) ??
        (await tx.apartment.create({
          data: {
            name: name,
            house_id: house?.id, // Используем прямой ID вместо connect
          },
        }));

      console.log("[createOrFindApartment] SUCCESS", {
        apartmentId: apartment?.id,
        name: apartment?.name,
        houseId: apartment?.house_id,
      });
      return apartment;
    } catch (error) {
      console.error("[createOrFindApartment] ERROR:", error);
      throw error;
    }
  }

  async createOrFindBirthPlace(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindBirthPlace] START", { input });
    console.log("[createOrFindBirthPlace] Creating/finding apartment...");
    const apartment = await this.createOrFindApartment(tx, input?.apartment);
    console.log("[createOrFindBirthPlace] Creating/finding house...");
    const house = await this.createOrFindHouse(tx, input?.house);
    console.log("[createOrFindBirthPlace] Creating/finding street...");
    const street = await this.createOrFindStreet(tx, input?.street);
    console.log("[createOrFindBirthPlace] Creating/finding city...");
    const city = await this.createOrFindCity(tx, input?.city);
    console.log("[createOrFindBirthPlace] Creating/finding country...");
    const country = await this.createOrFindCountry(tx, input?.country);

    console.log("[createOrFindBirthPlace] All locations found:", {
      apartment: apartment ? { id: apartment.id, name: apartment.name } : null,
      house: house ? { id: house.id, name: house.name } : null,
      street: street ? { id: street.id, name: street.name } : null,
      city: city ? { id: city.id, name: city.name } : null,
      country: country ? { id: country.id, name: country.name } : null,
    });

    // Парсим дату
    let birthDate: Date | null = null;
    if (input?.birth_date) {
      try {
        birthDate = new Date(input.birth_date);
        if (isNaN(birthDate.getTime())) birthDate = null;
      } catch {
        birthDate = null;
      }
    }

    const birthDateApprox = input?.birth_date_approx ?? false;

    const where: any = {
      birth_date_approx: birthDateApprox,
      birth_place_country_id: country?.id ?? null,
      birth_place_city_id: city?.id ?? null,
      birth_place_street: street?.id ?? null,
      birth_place_house: house?.id ?? null,
      birth_place_apartment: apartment?.id ?? null,
    };

    if (birthDate) where.birth_date = birthDate;

    try {
      const birthplace =
        (await tx.birth_place.findFirst({ where })) ??
        (await tx.birth_place.create({
          data: {
            ...(birthDate ? { birth_date: birthDate } : {}),
            birth_date_approx: birthDateApprox,
            birth_place_country_id: country?.id ?? null,
            birth_place_city_id: city?.id ?? null,
            birth_place_street: street?.id ?? null,
            birth_place_house: house?.id ?? null,
            birth_place_apartment: apartment?.id ?? null,
          },
        }));

      console.log("[createOrFindBirthPlace] SUCCESS", {
        birthPlaceId: birthplace?.id,
      });
      return birthplace;
    } catch (error) {
      console.error("[createOrFindBirthPlace] ERROR:", error);
      throw error;
    }
  }

  async createOrFindDeathPlace(tx: any, input?: LookupInput | null) {
    console.log("[createOrFindDeathPlace] START", { input });

    const city = await this.createOrFindCity(tx, input?.city);
    const country = await this.createOrFindCountry(tx, input?.country);

    let deathDate: Date | null = null;
    if (input?.death_date) {
      try {
        deathDate = new Date(input.death_date);
        if (isNaN(deathDate.getTime())) deathDate = null;
      } catch {
        deathDate = null;
      }
    }

    const deathDateApprox = input?.death_date_approx ?? false;

    const where: any = {
      death_date_approx: deathDateApprox,
      death_place_country_id: country?.id ?? null,
      death_place_city_id: city?.id ?? null,
    };

    if (deathDate) {
      where.death_date = deathDate;
    }

    try {
      const deathplace =
        (await tx.death_place.findFirst({ where })) ??
        (await tx.death_place.create({
          data: {
            ...(deathDate ? { death_date: deathDate } : {}),
            death_date_approx: deathDateApprox,
            death_place_country_id: country?.id ?? null,
            death_place_city_id: city?.id ?? null,
          },
        }));

      console.log("[createOrFindDeathPlace] SUCCESS", {
        deathPlaceId: deathplace?.id,
      });
      return deathplace;
    } catch (error) {
      console.error("[createOrFindDeathPlace] ERROR:", error);
      throw error;
    }
  }

  async buildData(tx: any, input?: any | null) {
    console.log("[buildData] START", { input });

    const surname = await this.createOrFindSurname(tx, input.surname);
    const maidensurname = await this.createOrFindMaidenSurname(
      tx,
      input.maidensurname,
    );
    const nationality = await this.createOrFindNationality(
      tx,
      input.nationality,
    );
    const socialStatus = await this.createOrFindSocialStatus(
      tx,
      input.social_status,
    );
    const birthPlace = await this.createOrFindBirthPlace(tx, input.birth_place);
    const deathPlace = await this.createOrFindDeathPlace(tx, input.death_place);

    // Используем ПРАВИЛЬНЫЕ названия полей из схемы
    const data: any = {
      firstname: input.firstname,
      patronymic: input.patronymic,
      age: input.age || 0,
      gender: input.gender || "unknown",
      bio: input.bio,
      source_info: input.source_info,
      ispersoncontacted: input.ispersoncontacted ?? false,
      isalive: input.isalive,
      marital_status: input.marital_status || "single",
    };

    // Добавляем связи - используем правильные имена полей из схемы
    if (surname) {
      data.surname = surname.id; // Просто ID, без connect
      console.log("[buildData] Added surname:", surname.id);
    }

    if (maidensurname) {
      data.maidensurname = maidensurname.id; // Просто ID
      console.log("[buildData] Added maidensurname:", maidensurname.id);
    }

    if (nationality) {
      data.nationality = nationality.id; // Просто ID
      console.log("[buildData] Added nationality:", nationality.id);
    }

    if (socialStatus) {
      data.socialstatus = socialStatus.id; // Внимание! В схеме socialstatus (без подчеркивания)
      console.log("[buildData] Added socialstatus:", socialStatus.id);
    }

    if (birthPlace) {
      data.birth_place = birthPlace.id; // Просто ID
      console.log("[buildData] Added birth_place:", birthPlace.id);
    }

    if (deathPlace) {
      data.death_place = deathPlace.id; // Просто ID
      console.log("[buildData] Added death_place:", deathPlace.id);
    }

    console.log("[buildData] Final data:", JSON.stringify(data, null, 2));
    return data;
  }
}
