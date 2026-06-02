import sanitizeHtml from 'sanitize-html';
import { Transform } from 'class-transformer';


export const StripHtml = () =>
    Transform(({ value }) =>
        typeof value === 'string'
            ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
            : value,
    );