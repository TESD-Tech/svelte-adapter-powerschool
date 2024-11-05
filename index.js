import { copy } from '@sveltejs/kit/node/fs';
import { zip } from 'adm-zip';
import { execSync } from 'child_process';

function powerschoolAdapter(userOptions) {
    return {
        name: 'svelte-adapter-powerschool',

        async adapt(builder) {
            // 1. Read configuration options
            const defaultOptions = {
                name: 'My PowerSchool Plugin',
                version: '1.0.0',
                description: 'A SvelteKit-powered PowerSchool plugin',
                author: 'Your Name',
                permissions: [],
                pages: {},
                resources: 'resources', // Default resources directory
                prebuild: null,
                postbuild: null
            };

            const options = { ...defaultOptions, ...userOptions };

            // 2. Execute prebuild script
            if (options.prebuild) {
                execSync(options.prebuild, { stdio: 'inherit' });
            }

            // 3. Build output directory structure
            const outputDir = 'build/powerschool';
            const pagesDir = `${outputDir}/pages`;
            const assetsDir = `${outputDir}/assets`;

            builder.rimraf(outputDir);

            // 4. Write client and prerendered files
            builder.writeClient(assetsDir);
            builder.writePrerendered(pagesDir);
            builder.generateEnvModule();

            // 5. Copy static files
            await copy(`${builder.config.kit.files.assets}/`, assetsDir, {
                filter: (file) => !/(?:app\.html|favicon\.png)$/.test(file)
            });

            // 6. Copy resource files
            await copy(options.resources, outputDir, {
                filter: (file) => !/^\./.test(file) // Exclude hidden files
            });

            // 7. Generate manifest.json
            const manifest = generateManifest(builder, options);
            builder.writeFileSync(`${outputDir}/manifest.json`, JSON.stringify(manifest, null, '  '));

            // 8. Package plugin into a zip file
            const zip = new AdmZip();
            zip.addLocalFolder(outputDir);
            zip.writeZip(`${outputDir}/plugin.zip`);

            // 9. Execute postbuild script
            if (options.postbuild) {
                execSync(options.postbuild, { stdio: 'inherit' });
            }

            builder.log(`Wrote pages to "${pagesDir}" and assets to "${assetsDir}"`);
            builder.log(`Created plugin package: ${outputDir}/plugin.zip`);
        }
    };
}

function generateManifest(builder, options) {
    const manifest = {
        name: options.name,
        version: options.version,
        description: options.description,
        author: options.author,
        permissions: options.permissions,
        pages: { ...options.pages }
    };

    for (const route of builder.routes) {
        if (route.id === '' || route.id === '/') continue;
        if (route.type === 'endpoint') continue;

        const page = route.id.replace(/^\//, '')
            .replace(/\[(.*?)\]/g, '{$1}')
            .replace(/\/$/, '/index');

        if (page) {
            manifest.pages[page] = {
                type: 'page',
                path: `${page}.html`
            };
        }
    }

    return manifest;
}

export default powerschoolAdapter;