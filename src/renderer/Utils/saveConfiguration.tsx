export const isValidString = (item) =>
  typeof item === 'string' && item.trim() !== '';

export const validateSection = (section) => {
  return section.every((item) => {
    if (typeof item === 'object') {
      return isValidString(item.en) && isValidString(item.fr);
    }
    return isValidString(item);
  });
};

export const findDuplicates = (section) => {
  const seenEn = new Set();
  const seenFr = new Set();
  const duplicates = { en: [], fr: [] };

  section.forEach((item, index) => {
    if (typeof item === 'object') {
      if (isValidString(item.en) && seenEn.has(item.en)) {
        duplicates.en.push({ value: item.en, index });
      } else {
        seenEn.add(item.en);
      }

      if (isValidString(item.fr) && seenFr.has(item.fr)) {
        duplicates.fr.push({ value: item.fr, index });
      } else {
        seenFr.add(item.fr);
      }
    } else if (isValidString(item) && seenEn.has(item)) {
      duplicates.en.push({ value: item, index });
    } else {
      seenEn.add(item);
    }
  });

  return duplicates;
};

export const validateConfig = (config, toast) => {
  const sections = {
    fedAuthSection: config.fedAuthSection.en,
    qcAuthSection: config.qcAuthSection.en,
    summarySection: config.summarySection.en,
  };

  const reportErrorAndStop = (message) => {
    toast({
      title: 'Validation Error',
      description: message,
      status: 'error',
      duration: 10000,
      isClosable: true,
    });
    return false;
  };

  return Object.entries(sections).every(([sectionName, items]) => {
    if (!validateSection(items)) {
      return reportErrorAndStop(`${sectionName}: Fields must not be empty.`);
    }

    const duplicates = findDuplicates(items);
    if (duplicates.en.length > 0) {
      return reportErrorAndStop(
        `${sectionName}, English: Duplicate entries found.`,
      );
    }

    if (duplicates.fr.length > 0) {
      return reportErrorAndStop(
        `${sectionName}, French: Duplicate entries found.`,
      );
    }

    return true;
  });
};
