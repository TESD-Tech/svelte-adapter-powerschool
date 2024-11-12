import path from 'node:path';
import fs from 'node:fs/promises';

/** @type {import('@sveltejs/kit').Adapter} */
export default function adapter(options = {}) {
  return {
    name: 'svelte-adapter-powerschool',

    async adapt(builder) {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const outputDir = `dist/WEB_ROOT/${packageJson.name}`;

      try {
        // Clear the output directory if it exists
        try {
          await fs.rm(outputDir, { recursive: true, force: true });
        } catch (error) {
          console.error('Error clearing output directory:', error);
        }

        // Ensure the output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Perform the build process
        builder.log.minor(`Writing to ${outputDir}`);
        builder.writeClient(outputDir);
        builder.writeServer(outputDir);
        builder.writePrerendered(outputDir);

        builder.log.success('Build completed successfully');
      } catch (error) {
        console.error('Error during adapter execution:', error);
        throw error;
      }
    }
  };
}