import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>,
) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "emails",
    `${templateName}.ejs`,
  );
  return ejs.renderFile(templatePath, data);
};
