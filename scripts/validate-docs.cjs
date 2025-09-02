#!/usr/bin/env node
/**
 * Documentation Validation Script
 * Ensures documentation stays in sync with code
 */

const fs = require('fs');
const path = require('path');

class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.basePath = path.join(__dirname, '..');
  }

  // Check if all API endpoints are documented
  validateAPIDocumentation() {
    const apiDir = path.join(this.basePath, 'api');
    
    if (!fs.existsSync(apiDir)) {
      this.warnings.push('API directory not found');
      return;
    }
    
    const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));
    const apiIndexPath = path.join(this.basePath, '.claude/API_INDEX.md');
    
    if (!fs.existsSync(apiIndexPath)) {
      this.errors.push('API_INDEX.md not found');
      return;
    }
    
    const apiIndexContent = fs.readFileSync(apiIndexPath, 'utf-8');
    
    apiFiles.forEach(file => {
      const endpoint = `/api/${file.replace('.ts', '')}`;
      if (!apiIndexContent.includes(endpoint)) {
        this.errors.push(`API endpoint ${endpoint} not documented in API_INDEX.md`);
      }
    });
  }

  // Check if all major components are documented
  validateComponentDocumentation() {
    const componentsDir = path.join(this.basePath, 'src/components');
    const frontendIndexPath = path.join(this.basePath, '.claude/FRONTEND_INDEX.md');
    
    if (!fs.existsSync(frontendIndexPath)) {
      this.errors.push('FRONTEND_INDEX.md not found');
      return;
    }
    
    const frontendIndexContent = fs.readFileSync(frontendIndexPath, 'utf-8');
    
    // Check major component directories
    const componentDirs = ['ai', 'ui', 'search', 'layouts', 'common'];
    componentDirs.forEach(dir => {
      const dirPath = path.join(componentsDir, dir);
      if (fs.existsSync(dirPath)) {
        const components = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));
        components.forEach(component => {
          const componentName = component.replace('.tsx', '');
          if (!frontendIndexContent.includes(componentName)) {
            this.warnings.push(`Component ${dir}/${componentName} might not be documented`);
          }
        });
      }
    });
  }

  // Check database schema documentation
  validateDatabaseDocumentation() {
    const dbIndexPath = path.join(this.basePath, '.claude/DATABASE_INDEX.md');
    
    if (!fs.existsSync(dbIndexPath)) {
      this.errors.push('DATABASE_INDEX.md not found');
      return;
    }
    
    const dbIndexContent = fs.readFileSync(dbIndexPath, 'utf-8');
    
    // Check for core tables
    const coreTables = ['companies', 'developments', 'economic_indicators', 'ai_conversations', 'ai_session_summaries'];
    coreTables.forEach(table => {
      if (!dbIndexContent.includes(table)) {
        this.errors.push(`Table '${table}' not documented in DATABASE_INDEX.md`);
      }
    });
  }

  // Check for outdated documentation
  checkDocumentationAge() {
    const docFiles = [
      '.claude/PROJECT_OVERVIEW.md',
      '.claude/API_INDEX.md',
      '.claude/FRONTEND_INDEX.md',
      '.claude/DATABASE_INDEX.md',
      '.claude/DEVELOPMENT.md',
      '.claude/ARCHITECTURE_CICD.md'
    ];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    docFiles.forEach(file => {
      const filePath = path.join(this.basePath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.mtime < thirtyDaysAgo) {
          this.warnings.push(`${file} hasn't been updated in over 30 days`);
        }
        
        // Check for outdated dates in content
        const content = fs.readFileSync(filePath, 'utf-8');
        const dateMatch = content.match(/Generated:\s*(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const docDate = new Date(dateMatch[1]);
          if (docDate < thirtyDaysAgo) {
            this.warnings.push(`${file} has outdated generation date`);
          }
        }
      }
    });
  }

  // Check environment variable documentation
  validateEnvironmentDocs() {
    const devPath = path.join(this.basePath, '.claude/DEVELOPMENT.md');
    const envExamplePath = path.join(this.basePath, '.env.example');
    
    if (!fs.existsSync(devPath) || !fs.existsSync(envExamplePath)) {
      return;
    }
    
    const devContent = fs.readFileSync(devPath, 'utf-8');
    const envExample = fs.readFileSync(envExamplePath, 'utf-8');
    
    // Extract env vars from .env.example
    const envVars = envExample.match(/^[A-Z_]+=/gm);
    if (envVars) {
      envVars.forEach(envVar => {
        const varName = envVar.replace('=', '');
        if (!devContent.includes(varName)) {
          this.warnings.push(`Environment variable ${varName} not documented in DEVELOPMENT.md`);
        }
      });
    }
  }

  // Generate summary
  generateSummary() {
    console.log('📋 Documentation Validation Report');
    console.log('===================================\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All documentation appears to be up to date!\n');
      return 0;
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ Found ${this.errors.length} error(s):\n`);
      this.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  Found ${this.warnings.length} warning(s):\n`);
      this.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
      console.log('');
    }
    
    console.log('💡 Suggestions:');
    console.log('   • Run "npm run docs:update" to update documentation');
    console.log('   • Update documentation files manually for specific changes');
    console.log('   • Ensure documentation is updated with code changes\n');
    
    return this.errors.length > 0 ? 1 : 0;
  }

  run() {
    console.log('🔍 Validating documentation...\n');
    
    this.validateAPIDocumentation();
    this.validateComponentDocumentation();
    this.validateDatabaseDocumentation();
    this.checkDocumentationAge();
    this.validateEnvironmentDocs();
    
    return this.generateSummary();
  }
}

// Run validator
const validator = new DocumentationValidator();
const exitCode = validator.run();
process.exit(exitCode);