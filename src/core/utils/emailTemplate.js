import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const emailTemplateFile = fileURLToPath(import.meta.url);
const emailTemplateDir = path.dirname(emailTemplateFile);

/**
 * Đọc file HTML template và thay thế các placeholder {{key}} bằng giá trị thực
 * @param {string} templateName - Tên file template (vd: 'otp', 'banned', 'unbanned')
 * @param {Object} variables - Object chứa các cặp key-value để thay thế
 * @returns {string} HTML string đã được render
 */
const renderEmailTemplate = (templateName, variables = {}) => {
    const templatePath = path.join(emailTemplateDir, '..', '..', '..', 'public', 'emails', `${templateName}.html`);
    let html = fs.readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value || '');
    }

    return html;
};

export default renderEmailTemplate;
