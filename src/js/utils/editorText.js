import EasyMDE from "easymde";
import DOMPurify from 'dompurify';
import TurndownService from "turndown";
import api from "./api";
import {dispatch} from "./functions";


class EditorText {
    constructor() {
        this.editorEl = document.getElementById('editor-popup')
        this.mdeElement = document.getElementById('editor-textarea')
        this.turndownService = new TurndownService()
        this.block = null

        this.turndownService.addRule('keepLink', {
            filter: (node) => {
                const href = node.getAttribute('href');
                return node.nodeName === 'A' && href === '#link-on-block';
            },
            replacement: (content, node) => {
                let attributes = '';
                for (let i = 0; i < node.attributes.length; i++) {
                    const attr = node.attributes[i];
                    attributes += ` ${attr.name}="${attr.value}"`;
                }
                return `<a${attributes}>${content}</a>`;
            }
        })
        this._createLinkOnBlock = {
            name: "block link",
            action: (editor) => {
                // Вставка шаблона ссылки
                const cm = editor.codemirror;
                const output = '<a href="#link-on-block" blockTarget="">Link Text</a>';
                cm.replaceSelection(output);
            },
            className: "fa fa-link",
            title: "block link",
        }
        this.editor = null

    }

    configureSanitizer(allBlocks) {
        // Добавление хука для каждого элемента перед санитизацией

        DOMPurify.addHook('beforeSanitizeAttributes', function (node) {
            if (node.tagName === 'A') {
                const blockPath = node.getAttribute('blockTarget');
                const href = node.getAttribute('href');
                if (href === '#link-on-block') {
                    const blockEl = document.getElementById(blockPath)
                    if (blockEl) {
                        node.setAttribute('x-on:click.stop.prevent', `openLinkOnBlock('${blockPath}')`);
                    } else {
                        node.innerText = 'wrong link'
                    }
                } else {
                    node.setAttribute('x-on:click.stop', '');
                }

            }
        });
    }

    sanitizeContent(html) {
        this.configureSanitizer(this.allBlocks)
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'em', 'strong', 'ul', 'ol', 'li', 'code',
                'pre', 'blockquote', 'br'],
            ALLOWED_ATTR: ['href', 'blockTarget', 'x-on:click.stop', 'x-on:click.stop.prevent']
        });
    }

    saveText(newValue) {
        if (this.block != null) {
            if (this.block.text !== newValue) {
                this.block.text = newValue
                api.setBlock(this.block.id, {...this.block})
            }
            this.block = null
        }
    }

    closeEditor() {
        if (this.editor == null) {
            return
        }

        const newText = this.editor.value()
        const htmlText = this.sanitizeContent(this.editor.options.previewRender(newText))
        this.saveText(htmlText.trim())

        this.contentEl.innerHTML = htmlText
        this.editor.toTextArea()
        this.editor = null
        this.mdeElement.value = ''
    }

    initMde(blockEl, block) {
        this.contentEl = blockEl.querySelector('[contentBlock]')
        this.block = block
        this.mdeElement.value = this.turndownService.turndown(this.contentEl.innerHTML)

        this.editor = new EasyMDE({
            element: this.mdeElement,
            lineNumbers: true,
            renderingConfig: {
                singleLineBreaks: true,
                codeSyntaxHighlighting: true,
            },
            allowHTML: true,
            toolbar: ['heading', '|',
                'bold', 'italic', 'strikethrough', '|',
                'code', 'quote', '|',
                'link', this._createLinkOnBlock, '|',
                'preview', 'side-by-side', '|',
                'unordered-list', 'ordered-list', '|',
                'horizontal-rule', 'guide']
        });

        this.editor.codemirror.on('focus', this.setCursorToEnd);
        setTimeout(() => {
            this.editor.codemirror.focus()
        })
    }


    setCursorToEnd(e) {
        console.log(e)
        var doc = e.getDoc();
        var lastLine = doc.lastLine();
        var lastChar = doc.getLine(lastLine).length;
        doc.setCursor(lastLine, lastChar);
    }
}

const editorText = new EditorText()
export default editorText
