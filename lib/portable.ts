// Preserve modern and legacy schema fields while replacing image references only.
export async function embedExamImages(json: string, load: (url: string) => Promise<string>) {
  const exam = JSON.parse(json);
  if (!exam || !Array.isArray(exam.questions)) throw new Error("Invalid exam content.");
  const downloads = new Map<string, Promise<string>>();
  let count = 0;
  const embed = async (url: string) => {
    if (/^data:image\//i.test(url)) return url;
    if (!downloads.has(url)) downloads.set(url, load(url));
    const data = await downloads.get(url)!;
    count++;
    return data;
  };
  const entry = async (value: unknown): Promise<unknown> => {
    if (typeof value === "string") return embed(value);
    if (Array.isArray(value)) return Promise.all(value.map(entry));
    if (value && typeof value === "object") {
      const image = { ...value } as Record<string, unknown>;
      for (const key of ["url", "src", "imageUrl"]) if (typeof image[key] === "string") image[key] = await embed(image[key] as string);
      return image;
    }
    return value;
  };
  const fields = async (owner: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) if (owner[key] !== undefined && owner[key] !== null) owner[key] = await entry(owner[key]);
  };
  for (const question of exam.questions) {
    await fields(question, ["images", "questionImages", "imageUrls", "questionImageUrls", "imageUrl", "image", "questionImageUrl"]);
    if (Array.isArray(question.options)) for (const option of question.options) {
      if (option && typeof option === "object") await fields(option, ["images", "imageUrls", "imageUrl", "image"]);
    }
  }
  return { json: JSON.stringify(exam, null, 2), count, downloaded: downloads.size };
}
