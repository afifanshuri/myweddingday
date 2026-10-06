const generateFilename = (file: File | null) => {
  return file
    ? crypto.randomUUID() + "_" + file.name
    : crypto.randomUUID() + "_" + "noName";
};

export { generateFilename };
