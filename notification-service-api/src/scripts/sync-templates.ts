import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Template } from '../modules/templates/core/template.entity';

/*

Since we have the templates in the file system, we need to sync them with the database
if we did any changes to the templates in the file system we will run this script to
migrate the changes to the database.

*/

// Load environment variables
config();

// Import mapping configuration
const emailMapping = require('../../templates/email-mapping');

interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function syncTemplates() {
  console.log('Starting templates sync from file system...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'notification_service',
    entities: [Template],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Database connected\n');

    const templateRepo = dataSource.getRepository(Template);

    // Sync email templates
    console.log('📧 Syncing Email Templates...');
    const emailStats = await syncEmailTemplates(
      templateRepo,
      emailMapping.emailMapping,
      emailMapping.templateVariables,
      emailMapping.templateMetadata,
    );

    // Print summary
    const totalStats = emailStats;

    console.log(`\n${'='.repeat(50)}`);
    console.log('📊Overall Sync Summary:');
    console.log(`${'='.repeat(50)}`);
    console.log(`   ✅ Created:  ${totalStats.created}`);
    console.log(`   🔄 Updated:  ${totalStats.updated}`);
    console.log(`   ⊘  Skipped:  ${totalStats.skipped}`);
    console.log(`   ❌ Errors:   ${totalStats.errors}`);
    console.log(
      `   📝 Total:    ${totalStats.created + totalStats.updated + totalStats.skipped}`,
    );
    console.log(`${'='.repeat(50)}`);

    if (totalStats.errors === 0) {
      console.log('\n✅ All templates synced successfully!');
    } else {
      console.log('\n Some templates had errors. Please check the logs above.');
    }
  } catch (error) {
    console.error('\n Fatal error syncing templates');
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

function extractSubjectFromHTML(htmlContent: string): string {
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

async function syncEmailTemplates(
  templateRepo: any,
  mapping: Record<string, string>,
  variables: Record<string, string[]>,
  metadata: Record<string, any>,
): Promise<SyncStats> {
  const stats: SyncStats = { created: 0, updated: 0, skipped: 0, errors: 0 };
  const templatesDir = path.join(process.cwd(), 'templates', 'email');

  for (const [fileName, templateCode] of Object.entries(mapping)) {
    try {
      const filePath = path.join(templatesDir, fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found: ${fileName}`);
        stats.errors++;
        continue;
      }

      // Read HTML content
      const htmlContent = fs.readFileSync(filePath, 'utf-8');

      // Extract subject from <title> tag
      const subject = extractSubjectFromHTML(htmlContent);

      if (!subject) {
        console.log(`   ⚠️  No <title> tag found in: ${fileName}`);
        stats.errors++;
        continue;
      }

      // Get variables
      const templateVariables = variables[templateCode] || [];

      // Get metadata
      const templateMetadata = metadata[templateCode] || {};

      // Check if template exists
      const existingTemplate = await templateRepo.findOne({
        where: { name: templateCode, channel: 'email' },
      });

      if (existingTemplate) {
        // Update existing template
        existingTemplate.subject = subject;
        existingTemplate.body = htmlContent;
        existingTemplate.variables = templateVariables;
        existingTemplate.metadata = templateMetadata;
        existingTemplate.version = existingTemplate.version + 1;

        await templateRepo.save(existingTemplate);
        console.log(
          `   ✓ Updated: ${templateCode} (v${existingTemplate.version}) - "${subject}"`,
        );
        stats.updated++;
      } else {
        // Create new template
        const newTemplate = templateRepo.create({
          name: templateCode,
          channel: 'email',
          subject,
          body: htmlContent,
          variables: templateVariables,
          metadata: templateMetadata,
          isActive: true,
        });

        await templateRepo.save(newTemplate);
        console.log(`   ✓ Created: ${templateCode} - "${subject}"`);
        stats.created++;
      }
    } catch (error) {
      console.log(` Error processing ${fileName}: ${error.message}`);
      stats.errors++;
    }
  }

  return stats;
}

syncTemplates();
