export default {
    input: 'src/main.js',
    output: {
        file: 'dist/bundle.js',
        format: 'cjs',
        exports: 'auto'
    },
    external: ['http',
               'querystring',
               'open',
               'fs/promises',
               'nconf',
               'readline',
               'googleapis',
               'moment',
               'nodemailer/lib/mail-composer',
               'clui',
               'async']
};