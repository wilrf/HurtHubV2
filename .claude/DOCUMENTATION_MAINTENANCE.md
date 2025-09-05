# Documentation Maintenance Guide

## 🔄 Documentation Update Strategy

### **Core Principle: Documentation as Code**

Documentation lives alongside code and gets updated with each feature/change.

---

## 📋 Update Triggers & Responsibilities

### **When to Update Documentation**

| Change Type                   | Files to Update                               | Priority    |
| ----------------------------- | --------------------------------------------- | ----------- |
| **New API Endpoint**          | `API_INDEX.md`, `PROJECT_OVERVIEW.md`         | 🔴 Critical |
| **New React Component**       | `FRONTEND_INDEX.md`                           | 🟡 High     |
| **Database Schema Change**    | `DATABASE_INDEX.md`, migration docs           | 🔴 Critical |
| **New Environment Variable**  | `DEVELOPMENT.md`, `ARCHITECTURE_CICD.md`      | 🔴 Critical |
| **Deployment Process Change** | `ARCHITECTURE_CICD.md`                        | 🟡 High     |
| **New Service/Hook**          | `FRONTEND_INDEX.md`                           | 🟡 High     |
| **Architecture Decision**     | `ARCHITECTURE_CICD.md`, `PROJECT_OVERVIEW.md` | 🟡 High     |
| **Bug Fix**                   | Update relevant section if behavior changes   | 🟢 Medium   |

---

## 🤖 Automated Documentation Helpers

### **1. Git Pre-commit Hook**

Create `.husky/pre-commit` to remind about documentation:

```bash
#!/bin/sh
# .husky/pre-commit

# Check if certain files changed that require doc updates
CHANGED_FILES=$(git diff --cached --name-only)

# Check for API changes
if echo "$CHANGED_FILES" | grep -q "^api/"; then
  echo "⚠️  API files changed. Remember to update .claude/API_INDEX.md"
  echo "Press Enter to continue or Ctrl+C to cancel and update docs..."
  read
fi

# Check for database migrations
if echo "$CHANGED_FILES" | grep -q "migrations/\|supabase/"; then
  echo "⚠️  Database changes detected. Update .claude/DATABASE_INDEX.md"
  echo "Press Enter to continue or Ctrl+C to cancel and update docs..."
  read
fi

# Check for new components
if echo "$CHANGED_FILES" | grep -q "src/components/.*\.tsx$"; then
  echo "📝 New components detected. Consider updating .claude/FRONTEND_INDEX.md"
fi

# Check for environment variables
if echo "$CHANGED_FILES" | grep -q "\.env\|env\.ts"; then
  echo "🔐 Environment changes detected. Update .claude/DEVELOPMENT.md"
  echo "Press Enter to continue or Ctrl+C to cancel and update docs..."
  read
fi
```

### **2. Documentation Validation Script**

Create `scripts/validate-docs.js`:

```javascript
// scripts/validate-docs.js
const fs = require("fs");
const path = require("path");

class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Check if all API endpoints are documented
  validateAPIDocumentation() {
    const apiDir = path.join(__dirname, "../api");
    const apiFiles = fs.readdirSync(apiDir).filter((f) => f.endsWith(".ts"));

    const apiIndexContent = fs.readFileSync(
      path.join(__dirname, "../.claude/API_INDEX.md"),
      "utf-8",
    );

    apiFiles.forEach((file) => {
      const endpoint = `/api/${file.replace(".ts", "")}`;
      if (!apiIndexContent.includes(endpoint)) {
        this.errors.push(
          `API endpoint ${endpoint} not documented in API_INDEX.md`,
        );
      }
    });
  }

  // Check if all components are documented
  validateComponentDocumentation() {
    const componentsDir = path.join(__dirname, "../src/components");
    const frontendIndexContent = fs.readFileSync(
      path.join(__dirname, "../.claude/FRONTEND_INDEX.md"),
      "utf-8",
    );

    // Recursively find all .tsx files
    const findComponents = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          findComponents(fullPath);
        } else if (file.endsWith(".tsx")) {
          const componentName = file.replace(".tsx", "");
          if (!frontendIndexContent.includes(componentName)) {
            this.warnings.push(
              `Component ${componentName} might not be documented`,
            );
          }
        }
      });
    };

    findComponents(componentsDir);
  }

  // Check database schema documentation
  validateDatabaseDocumentation() {
    const dbIndexContent = fs.readFileSync(
      path.join(__dirname, "../.claude/DATABASE_INDEX.md"),
      "utf-8",
    );

    // Check for table references in type definitions
    const dbTypesPath = path.join(__dirname, "../src/types/database.types.ts");
    if (fs.existsSync(dbTypesPath)) {
      const dbTypes = fs.readFileSync(dbTypesPath, "utf-8");
      const tables = dbTypes.match(/Tables:\s*{([^}]+)}/s);
      if (tables) {
        const tableNames = tables[1].match(/(\w+):/g);
        tableNames?.forEach((table) => {
          const tableName = table.replace(":", "");
          if (!dbIndexContent.includes(tableName)) {
            this.errors.push(
              `Table ${tableName} not documented in DATABASE_INDEX.md`,
            );
          }
        });
      }
    }
  }

  // Check for outdated version numbers or dates
  checkMetadata() {
    const files = [
      ".claude/PROJECT_OVERVIEW.md",
      ".claude/API_INDEX.md",
      ".claude/FRONTEND_INDEX.md",
      ".claude/DATABASE_INDEX.md",
      ".claude/DEVELOPMENT.md",
      ".claude/ARCHITECTURE_CICD.md",
    ];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    files.forEach((file) => {
      const content = fs.readFileSync(
        path.join(__dirname, "..", file),
        "utf-8",
      );
      const dateMatch = content.match(/Generated:\s*(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const docDate = new Date(dateMatch[1]);
        if (docDate < thirtyDaysAgo) {
          this.warnings.push(`${file} was last updated over 30 days ago`);
        }
      }
    });
  }

  run() {
    console.log("🔍 Validating documentation...\n");

    this.validateAPIDocumentation();
    this.validateComponentDocumentation();
    this.validateDatabaseDocumentation();
    this.checkMetadata();

    if (this.errors.length > 0) {
      console.error("❌ Documentation Errors:");
      this.errors.forEach((e) => console.error(`  - ${e}`));
    }

    if (this.warnings.length > 0) {
      console.warn("\n⚠️  Documentation Warnings:");
      this.warnings.forEach((w) => console.warn(`  - ${w}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("✅ Documentation is up to date!");
    }

    return this.errors.length === 0 ? 0 : 1;
  }
}

const validator = new DocumentationValidator();
process.exit(validator.run());
```

### **3. Package.json Scripts**

Add these to `package.json`:

```json
{
  "scripts": {
    "docs:validate": "node scripts/validate-docs.js",
    "docs:update": "node scripts/update-docs.js",
    "predeploy": "npm run docs:validate",
    "commit": "npm run docs:validate && git add . && git commit"
  }
}
```

---

## 📝 Documentation Update Checklist

### **For Each Pull Request**

```markdown
## Documentation Checklist

- [ ] Updated relevant `.claude/*.md` files
- [ ] Ran `npm run docs:validate`
- [ ] Updated version/date in modified docs
- [ ] Added migration notes if breaking changes
- [ ] Updated environment variables documentation
- [ ] Verified examples still work
```

---

## 🔧 Semi-Automated Update Script

Create `scripts/update-docs.js`:

```javascript
// scripts/update-docs.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class DocumentationUpdater {
  constructor() {
    this.updates = [];
    this.today = new Date().toISOString().split("T")[0];
  }

  // Update all documentation dates
  updateDates() {
    const files = fs
      .readdirSync(path.join(__dirname, "../.claude"))
      .filter((f) => f.endsWith(".md"));

    files.forEach((file) => {
      const filePath = path.join(__dirname, "../.claude", file);
      let content = fs.readFileSync(filePath, "utf-8");

      // Update generated date
      content = content.replace(
        /Generated:\s*\d{4}-\d{2}-\d{2}/g,
        `Generated: ${this.today}`,
      );

      // Update last updated date
      if (content.includes("Last Updated:")) {
        content = content.replace(
          /Last Updated:\s*\d{4}-\d{2}-\d{2}/g,
          `Last Updated: ${this.today}`,
        );
      } else {
        content = content.replace(
          /(\*Generated:[^\n]+)/,
          `$1\n*Last Updated: ${this.today}*`,
        );
      }

      fs.writeFileSync(filePath, content);
      this.updates.push(`Updated dates in ${file}`);
    });
  }

  // Scan for new API endpoints
  scanAPIEndpoints() {
    const apiDir = path.join(__dirname, "../api");
    const apiFiles = fs.readdirSync(apiDir).filter((f) => f.endsWith(".ts"));

    const apiIndexPath = path.join(__dirname, "../.claude/API_INDEX.md");
    const apiIndexContent = fs.readFileSync(apiIndexPath, "utf-8");

    const newEndpoints = [];

    apiFiles.forEach((file) => {
      const endpoint = `/api/${file.replace(".ts", "")}`;
      if (!apiIndexContent.includes(endpoint)) {
        newEndpoints.push({
          file,
          endpoint,
          path: path.join(apiDir, file),
        });
      }
    });

    if (newEndpoints.length > 0) {
      console.log("\n📌 New API endpoints detected:");
      newEndpoints.forEach((ep) => {
        console.log(`  - ${ep.endpoint} (${ep.file})`);

        // Read the file to extract method and description
        const content = fs.readFileSync(ep.path, "utf-8");
        const methodMatch = content.match(/req\.method\s*===?\s*['"](\w+)['"]/);
        const method = methodMatch ? methodMatch[1] : "Unknown";

        console.log(`    Method: ${method}`);
        console.log(`    TODO: Add documentation to API_INDEX.md`);
      });

      this.updates.push(
        `Found ${newEndpoints.length} undocumented API endpoints`,
      );
    }
  }

  // Scan for new components
  scanComponents() {
    const componentsDir = path.join(__dirname, "../src/components");
    const frontendIndexPath = path.join(
      __dirname,
      "../.claude/FRONTEND_INDEX.md",
    );
    const frontendIndexContent = fs.readFileSync(frontendIndexPath, "utf-8");

    const newComponents = [];

    const findComponents = (dir, basePath = "") => {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const relativePath = path.join(basePath, file);

        if (fs.statSync(fullPath).isDirectory()) {
          findComponents(fullPath, relativePath);
        } else if (file.endsWith(".tsx") && !file.includes(".test.")) {
          const componentName = file.replace(".tsx", "");
          if (!frontendIndexContent.includes(componentName)) {
            newComponents.push({
              name: componentName,
              path: relativePath,
            });
          }
        }
      });
    };

    findComponents(componentsDir);

    if (newComponents.length > 0) {
      console.log("\n🎨 New components detected:");
      newComponents.forEach((comp) => {
        console.log(`  - ${comp.name} (${comp.path})`);
      });

      this.updates.push(
        `Found ${newComponents.length} undocumented components`,
      );
    }
  }

  // Check for database changes
  checkDatabaseChanges() {
    // Check git diff for database-related files
    try {
      const diff = execSync("git diff --name-only HEAD~1", {
        encoding: "utf-8",
      });
      const dbFiles = diff
        .split("\n")
        .filter(
          (f) =>
            f.includes("migration") ||
            f.includes("schema") ||
            f.includes("database.types.ts"),
        );

      if (dbFiles.length > 0) {
        console.log("\n🗄️ Database changes detected:");
        dbFiles.forEach((file) => console.log(`  - ${file}`));
        console.log("  TODO: Update DATABASE_INDEX.md");

        this.updates.push(
          `Database schema changes detected in ${dbFiles.length} files`,
        );
      }
    } catch (error) {
      // Git command failed, skip
    }
  }

  // Generate update report
  generateReport() {
    const reportPath = path.join(
      __dirname,
      "../.claude/DOCUMENTATION_STATUS.md",
    );

    const report = `# Documentation Status Report

Generated: ${this.today}

## Recent Updates
${this.updates.map((u) => `- ${u}`).join("\n")}

## Documentation Files
${fs
  .readdirSync(path.join(__dirname, "../.claude"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const stats = fs.statSync(path.join(__dirname, "../.claude", f));
    const modified = stats.mtime.toISOString().split("T")[0];
    return `- **${f}**: Last modified ${modified}`;
  })
  .join("\n")}

## Next Steps
1. Review any new endpoints, components, or database changes
2. Update corresponding documentation files
3. Run \`npm run docs:validate\` to verify
4. Commit documentation updates with code changes
`;

    fs.writeFileSync(reportPath, report);
    console.log(`\n📊 Documentation status report saved to ${reportPath}`);
  }

  run() {
    console.log("🔄 Updating documentation...\n");

    this.updateDates();
    this.scanAPIEndpoints();
    this.scanComponents();
    this.checkDatabaseChanges();
    this.generateReport();

    console.log("\n✅ Documentation update complete!");
    console.log(`  ${this.updates.length} updates performed`);
  }
}

const updater = new DocumentationUpdater();
updater.run();
```

---

## 🏷️ Version Control Integration

### **1. Documentation Tags in Code**

Add documentation tags in your code that can be extracted:

```typescript
/**
 * @endpoint /api/ai-chat-simple
 * @method POST
 * @description Main AI chat endpoint with business context
 * @params {messages, model, temperature, sessionId}
 * @returns {content, usage, model, sessionId}
 * @docs .claude/API_INDEX.md#ai-chat-simple
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... implementation
}
```

### **2. Auto-generate from JSDoc**

Create a script to extract JSDoc comments and update documentation:

```javascript
// scripts/extract-jsdoc.js
const fs = require("fs");
const path = require("path");

function extractJSDoc(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
  const matches = content.match(jsdocRegex);

  return matches
    ?.map((comment) => {
      const endpoint = comment.match(/@endpoint\s+(.+)/)?.[1];
      const method = comment.match(/@method\s+(.+)/)?.[1];
      const description = comment.match(/@description\s+(.+)/)?.[1];
      const params = comment.match(/@params\s+(.+)/)?.[1];
      const returns = comment.match(/@returns\s+(.+)/)?.[1];

      return { endpoint, method, description, params, returns };
    })
    .filter((doc) => doc.endpoint);
}

// Extract from all API files
const apiDir = path.join(__dirname, "../api");
const apiDocs = fs
  .readdirSync(apiDir)
  .filter((f) => f.endsWith(".ts"))
  .flatMap((file) => extractJSDoc(path.join(apiDir, file)) || []);

console.log("Extracted API documentation:", apiDocs);
// TODO: Update API_INDEX.md with extracted docs
```

---

## 📅 Regular Maintenance Schedule

### **Weekly Tasks**

- [ ] Run `npm run docs:validate`
- [ ] Review `DOCUMENTATION_STATUS.md`
- [ ] Update any stale documentation

### **Monthly Tasks**

- [ ] Full documentation review
- [ ] Update all "Generated" dates
- [ ] Archive old documentation versions
- [ ] Review and update examples

### **Per Release**

- [ ] Update version numbers
- [ ] Document breaking changes
- [ ] Update migration guides
- [ ] Create release notes from documentation changes

---

## 🤝 Team Practices

### **Documentation-Driven Development (DDD)**

1. **Write documentation first** for new features
2. **Update docs with code** in same commit
3. **Review docs in PR** alongside code
4. **Test examples** in documentation

### **Documentation Review Checklist**

```markdown
- [ ] Is the documentation accurate?
- [ ] Are all new features documented?
- [ ] Do examples work?
- [ ] Are breaking changes noted?
- [ ] Is the language clear and concise?
- [ ] Are dates/versions updated?
```

---

## 🔧 Quick Commands

```bash
# Validate documentation
npm run docs:validate

# Update documentation dates and scan for changes
npm run docs:update

# Check what needs documentation
git diff --name-only | grep -E "(api/|src/components/|migrations/)"

# Find TODOs in documentation
grep -r "TODO" .claude/

# Check documentation age
find .claude -name "*.md" -mtime +30 -exec echo "Old: {}" \;
```

---

_Generated: 2025-09-02_  
_Purpose: Keep documentation synchronized with code changes_  
_Automation Level: Semi-automated with validation and update scripts_
