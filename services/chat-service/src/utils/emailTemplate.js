import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Đọc file HTML template và thay thế các placeholder {{key}} bằng giá trị thực.
 *
 * Mỗi service khi dùng hàm này cần có thư mục `public/emails/` chứa các file .html.
 * Hoặc truyền `templatesDir` vào để chỉ định đường dẫn tùy chỉnh.
 *
 * @param {string} templateName  - Tên file template (vd: 'otp', 'banned', 'appeal_approved')
 * @param {Object} variables     - Object chứa các cặp key-value để thay thế {{key}}
 * @param {string} [templatesDir] - (Optional) Đường dẫn tuyệt đối tới thư mục chứa templates
 * @returns {string} HTML string đã được render
 */
const renderEmailTemplate = (templateName, variables = {}, templatesDir = null) => {
    let templatePath;

    if (templatesDir) {
        templatePath = path.join(templatesDir, `${templateName}.html`);
    } else {
        // Default: tìm templates relative đến CWD (process working directory)
        templatePath = path.join(process.cwd(), 'public', 'emails', `${templateName}.html`);
    }

    let html = fs.readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value || '');
    }

    return html;
};

export default renderEmailTemplate;
