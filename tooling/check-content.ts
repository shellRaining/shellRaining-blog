import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import matter from "gray-matter";

interface ContentRules {
  allowedCategories: string[];
  allowedExtensions: string[];
  namePattern: string;
  ignoredDirectories?: string[];
  ignoredFiles?: string[];
  allowedTags: string[];
  requireCategoryTag?: boolean;
}

interface ValidationContext {
  rules: ContentRules;
  docsRoot: string;
  nameRegex: RegExp;
  allowedExtensions: Set<string>;
  allowedCategories: Set<string>;
  ignoredDirectories: Set<string>;
  ignoredFiles: Set<string>;
  allowedTags: Set<string>;
  errors: string[];
}

async function ensureContentRules(): Promise<ValidationContext> {
  const rulesPath = path.resolve("packages/content/content-rules.json");
  const raw = await readFile(rulesPath, "utf8");
  const rules: ContentRules = JSON.parse(raw);
  const docsRoot = path.resolve("packages/content/docs");

  return {
    rules,
    docsRoot,
    nameRegex: new RegExp(rules.namePattern),
    allowedExtensions: new Set(rules.allowedExtensions),
    allowedCategories: new Set(rules.allowedCategories),
    ignoredDirectories: new Set(rules.ignoredDirectories ?? []),
    ignoredFiles: new Set(rules.ignoredFiles ?? []),
    allowedTags: new Set(rules.allowedTags),
    errors: [],
  };
}

async function validate() {
  const ctx = await ensureContentRules();
  await walkDocs(ctx.docsRoot, ctx, []);
  report(ctx.errors);
}

async function walkDocs(
  currentPath: string,
  ctx: ValidationContext,
  ancestors: string[],
) {
  const entries = await readdir(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    const relativeParts = [...ancestors, entry.name];
    if (entry.isDirectory()) {
      if (ctx.ignoredDirectories.has(entry.name)) {
        continue;
      }
      checkDirectory(entry, relativeParts, ctx);
      await walkDocs(path.join(currentPath, entry.name), ctx, relativeParts);
      continue;
    }
    if (entry.isFile()) {
      if (ctx.ignoredFiles.has(entry.name)) {
        continue;
      }
      await checkFile(path.join(currentPath, entry.name), relativeParts, ctx);
      continue;
    }
    ctx.errors.push(`不支持的条目类型：${relativeParts.join("/")}`);
  }
}

function checkDirectory(
  entry: { name: string },
  pathParts: string[],
  ctx: ValidationContext,
) {
  const depth = pathParts.length;
  const dirName = entry.name;
  if (!ctx.nameRegex.test(dirName)) {
    ctx.errors.push(`目录名需使用小写连字符：${pathParts.join("/")}`);
  }
  if (depth === 1 && !ctx.allowedCategories.has(dirName)) {
    ctx.errors.push(
      `docs 顶层仅允许分类 ${Array.from(ctx.allowedCategories).join(", ")}，检测到：${dirName}`,
    );
  }
}

async function checkFile(
  fullPath: string,
  pathParts: string[],
  ctx: ValidationContext,
) {
  const fileName = pathParts[pathParts.length - 1];
  const ext = path.extname(fileName);
  const slug = fileName.slice(0, -ext.length);
  const relativePath = pathParts.join("/");

  if (!ctx.allowedExtensions.has(ext)) {
    ctx.errors.push(`不允许的文件扩展名：${relativePath}`);
    return;
  }

  if (ext !== ".md") {
    return;
  }

  if (!ctx.nameRegex.test(slug)) {
    ctx.errors.push(`文件名需使用小写连字符：${relativePath}`);
  }

  const fileContent = await readFile(fullPath, "utf8");
  const parsed = matter(fileContent);
  const data = parsed.data ?? {};
  const tagsField = data.tag ?? data.tags;

  if (data.tags && !data.tag) {
    ctx.errors.push(
      `请将 frontmatter 的 "tags" 字段重命名为 "tag"：${relativePath}`,
    );
  }

  if (!Array.isArray(tagsField)) {
    ctx.errors.push(`frontmatter 缺少有效的 tag 数组：${relativePath}`);
    return;
  }

  const tags = tagsField.map((item: unknown) =>
    typeof item === "string" ? item.trim() : item,
  );
  const invalidType = tags.some(
    (item: unknown) => typeof item !== "string" || item.length === 0,
  );
  if (invalidType) {
    ctx.errors.push(`tag 需为非空字符串数组：${relativePath}`);
    return;
  }

  const categories = ctx.rules.requireCategoryTag ? [pathParts[0]] : [];
  for (const category of categories) {
    if (category && !tags.includes(category)) {
      ctx.errors.push(`标签需包含所属分类 "${category}"：${relativePath}`);
    }
  }

  for (const tag of tags) {
    if (!ctx.allowedTags.has(tag)) {
      ctx.errors.push(`检测到未登记的标签 "${tag}"：${relativePath}`);
    }
  }
}

function report(errors: string[]) {
  if (errors.length === 0) {
    return;
  }
  console.error("内容校验失败：");
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exitCode = 1;
}

validate().catch((error) => {
  console.error("内容校验脚本异常", error);
  process.exitCode = 1;
});
