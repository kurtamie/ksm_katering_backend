export const normalizePhoneNo = (phoneNo?: string | number | null) => {
  const digits = String(phoneNo ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
};

export const phoneNoVariants = (phoneNo?: string | number | null) => {
  const normalized = normalizePhoneNo(phoneNo);
  const variants = new Set<string>();

  if (normalized) {
    variants.add(normalized);

    if (normalized.startsWith("62")) {
      variants.add(`0${normalized.slice(2)}`);
    }
  }

  const raw = String(phoneNo ?? "").trim();
  if (raw) {
    variants.add(raw);
  }

  return [...variants];
};

export const findUserByPhoneNo = (strapi: any, phoneNo?: string | number | null) => {
  const variants = phoneNoVariants(phoneNo);

  if (!variants.length) {
    return null;
  }

  return strapi.db.query("plugin::users-permissions.user").findOne({
    where: {
      $or: variants.map((phone_no) => ({ phone_no })),
    },
  });
};
