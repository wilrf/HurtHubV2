#!/usr/bin/env node
/**
 * Documentation Update Script
 * Helps keep documentation synchronized with code changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationUpdater {
  constructor() {
    this.basePath = path.join(__dirname, '..');
    this.today = new Date().toISOString().split('T')[0];
    this.updates = [];
    this.todos = [];
  }

  // Update all documentation dates
  updateDocumentationDates() {
    console.log('📅 Updating documentation dates...');
    
    const docDir = path.join(this.basePath, '.claude');
    if (!fs.existsSync(docDir)) {
      console.log('   Documentation directory not found');
      return;
    }
    
    const files = fs.readdirSync(docDir).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
      const filePath = path.join(docDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      let updated = false;
      
      // Update Generated date if it exists
      if (content.includes('Generated:')) {
        const oldContent = content;
        content = content.replace(
          /Generated:\s*\d{4}-\d{2}-\d{2}/g,
          `Generated: ${this.today}`
        );
        if (oldContent !== content) {
          updated = true;
        }
      }
      
      // Add or update Last Updated date
      if (content.includes('Last Updated:')) {
        content = content.replace(
          /Last Updated:\s*\d{4}-\d{2}-\d{2}/g,
          `Last Updated: ${this.today}`
        );
      } else if (content.includes('Generated:')) {
        content = content.replace(
          /(\*Generated:[^\n]+\*)/,
          `$1\n*Last Updated: ${this.today}*`
        );
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        this.updates.push(`Updated dates in ${file}`);
      }
    });
  }

  // Scan for new API endpoints
  scanForNewAPIs() {
    console.log('🔍 Scanning for new API endpoints...');
    
    const apiDir = path.join(this.basePath, 'api');
    const apiIndexPath = path.join(this.basePath, '.claude/API_INDEX.md');
    
    if (!fs.existsSync(apiDir) || !fs.existsSync(apiIndexPath)) {
      return;
    }
    
    const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));
    const apiIndexContent = fs.readFileSync(apiIndexPath, 'utf-8');
    
    const newEndpoints = [];
    
    apiFiles.forEach(file => {
      const endpoint = `/api/${file.replace('.ts', '')}`;
      if (!apiIndexContent.includes(endpoint)) {
        // Try to extract method from file
        const filePath = path.join(apiDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        let method = 'Unknown';
        const methodMatch = content.match(/req\.method\s*[!=]==?\s*['"](\w+)['"]/);
        if (methodMatch) {
          method = methodMatch[1];
        }
        
        let description = 'TODO: Add description';
        const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+)/);
        if (commentMatch) {
          description = commentMatch[1];
        }
        
        newEndpoints.push({
          endpoint,
          file,
          method,
          description
        });
      }
    });
    
    if (newEndpoints.length > 0) {
      console.log(`   Found ${newEndpoints.length} new endpoint(s):`);
      newEndpoints.forEach(ep => {
        console.log(`     • ${ep.endpoint} [${ep.method}]`);
        this.todos.push(`Document ${ep.endpoint} in API_INDEX.md`);
      });
    } else {
      console.log('   No new endpoints found');
    }
  }

  // Scan for new components
  scanForNewComponents() {
    console.log('🎨 Scanning for new components...');
    
    const componentsDir = path.join(this.basePath, 'src/components');
    const frontendIndexPath = path.join(this.basePath, '.claude/FRONTEND_INDEX.md');
    
    if (!fs.existsSync(componentsDir) || !fs.existsSync(frontendIndexPath)) {
      return;
    }
    
    const frontendIndexContent = fs.readFileSync(frontendIndexPath, 'utf-8');
    const newComponents = [];
    
    const scanDir = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath, path.join(prefix, item));
        } else if (item.endsWith('.tsx') && !item.includes('.test.')) {
          const componentName = item.replace('.tsx', '');
          const componentPath = path.join(prefix, componentName);
          
          if (!frontendIndexContent.includes(componentName)) {
            newComponents.push({
              name: componentName,
              path: componentPath
            });
          }
        }
      });
    };
    
    scanDir(componentsDir);
    
    if (newComponents.length > 0) {
      console.log(`   Found ${newComponents.length} new component(s):`);
      newComponents.forEach(comp => {
        console.log(`     • ${comp.name} (${comp.path})`);
        this.todos.push(`Document ${comp.name} component in FRONTEND_INDEX.md`);
      });
    } else {
      console.log('   No new components found');
    }
  }

  // Check for recent git changes
  checkGitChanges() {
    console.log('📝 Checking recent git changes...');
    
    try {
      // Get files changed in last commit
      const changed = execSync('git diff --name-only HEAD~1 HEAD', { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim().split('\n').filter(Boolean);
      
      const relevantChanges = {
        api: [],
        components: [],
        database: [],
        config: []
      };
      
      changed.forEach(file => {
        if (file.startsWith('api/')) {
          relevantChanges.api.push(file);
        } else if (file.includes('components/')) {
          relevantChanges.components.push(file);
        } else if (file.includes('migration') || file.includes('schema') || file.includes('database')) {
          relevantChanges.database.push(file);
        } else if (file.includes('.env') || file.includes('config')) {
          relevantChanges.config.push(file);
        }
      });
      
      if (relevantChanges.api.length > 0) {
        console.log(`   API changes in: ${relevantChanges.api.join(', ')}`);
        this.todos.push('Update API_INDEX.md for API changes');
      }
      
      if (relevantChanges.components.length > 0) {
        console.log(`   Component changes in: ${relevantChanges.components.join(', ')}`);
        this.todos.push('Update FRONTEND_INDEX.md for component changes');
      }
      
      if (relevantChanges.database.length > 0) {
        console.log(`   Database changes in: ${relevantChanges.database.join(', ')}`);
        this.todos.push('Update DATABASE_INDEX.md for schema changes');
      }
      
      if (relevantChanges.config.length > 0) {
        console.log(`   Config changes in: ${relevantChanges.config.join(', ')}`);
        this.todos.push('Update DEVELOPMENT.md for configuration changes');
      }
      
    } catch (error) {
      console.log('   Unable to check git changes (not a git repository or no commits)');
    }
  }

  // Generate status report
  generateStatusReport() {
    const reportPath = path.join(this.basePath, '.claude/DOCUMENTATION_STATUS.md');
    
    const report = `# Documentation Status Report

Generated: ${this.today}

## Recent Updates
${this.updates.length > 0 ? this.updates.map(u => `- ${u}`).join('\n') : '- No updates performed'}

## TODO Items
${this.todos.length > 0 ? this.todos.map(t => `- [ ] ${t}`).join('\n') : '- All documentation appears up to date'}

## Documentation Files Status
${(() => {
  const docDir = path.join(this.basePath, '.claude');
  if (!fs.existsSync(docDir)) return 'Documentation directory not found';
  
  return fs.readdirSync(docDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const stats = fs.statSync(path.join(docDir, f));
      const modified = stats.mtime.toISOString().split('T')[0];
      const size = (stats.size / 1024).toFixed(1);
      return `- **${f}**: Last modified ${modified} (${size} KB)`;
    }).join('\n');
})()}

## Quick Actions
\`\`\`bash
# Validate documentation
npm run docs:validate

# Update documentation dates
npm run docs:update

# Check for undocumented changes
git diff --name-only HEAD~1 | grep -E "(api/|src/components/|migrations/)"

# Find TODOs in documentation
grep -r "TODO" .claude/
\`\`\`

## Next Steps
1. Review TODO items above
2. Update documentation files as needed
3. Run \`npm run docs:validate\` to verify
4. Commit documentation updates with code changes

---
*This report was automatically generated by scripts/update-docs.js*
`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`\n📊 Status report saved to: .claude/DOCUMENTATION_STATUS.md`);
  }

  // Main execution
  run() {
    console.log('🔄 Documentation Update Tool\n');
    
    this.updateDocumentationDates();
    this.scanForNewAPIs();
    this.scanForNewComponents();
    this.checkGitChanges();
    this.generateStatusReport();
    
    console.log('\n✅ Documentation update complete!\n');
    
    if (this.updates.length > 0) {
      console.log('Updates performed:');
      this.updates.forEach(update => console.log(`  • ${update}`));
    }
    
    if (this.todos.length > 0) {
      console.log('\n📌 Action items:');
      this.todos.forEach(todo => console.log(`  • ${todo}`));
    }
    
    console.log('\nRun "npm run docs:validate" to check documentation completeness');
  }
}

// Run updater
const updater = new DocumentationUpdater();
updater.run();