//#region TagType definitions
var TagType;
(function (TagType) {
    TagType[TagType["Paragraph"] = 0] = "Paragraph";
    TagType[TagType["Header1"] = 1] = "Header1";
    TagType[TagType["Header2"] = 2] = "Header2";
    TagType[TagType["Header3"] = 3] = "Header3";
    TagType[TagType["HorizontalRule"] = 4] = "HorizontalRule";
})(TagType || (TagType = {}));
class TagTypeToHtml {
    constructor() {
        this.tagType = new Map();
        this.tagType.set(TagType.Header1, "h1");
        this.tagType.set(TagType.Header2, "h2");
        this.tagType.set(TagType.Header3, "h3");
        this.tagType.set(TagType.Paragraph, "p");
        this.tagType.set(TagType.HorizontalRule, "hr");
    }
    OpeningTag(tagType) {
        return this.GetTag(tagType, `<`);
    }
    ClosingTag(tagType) {
        return this.GetTag(tagType, `</`);
    }
    GetTag(tagType, openingTagPattern) {
        let tag = this.tagType.get(tagType);
        if (tag !== null) {
            return `${openingTagPattern}${tag}>`;
        }
        return `${openingTagPattern}p>`;
    }
}
class MarkdownDocument {
    constructor() {
        this.content = "";
    }
    Add(...content) {
        content.forEach(element => {
            this.content += element;
        });
    }
    Get() {
        return this.content;
    }
}
//#endregion Markdown document
//#region Parsing elements
class LineParser {
    Parse(value, tag) {
        let output = [false, ""];
        output[1] = value;
        if (value === "") {
            return output;
        }
        let split = value.startsWith(`${tag}`);
        if (split) {
            output[0] = true;
            output[1] = value.substr(tag.length);
        }
        return output;
    }
}
class ParseElement {
    constructor() {
        this.CurrentLine = "";
    }
}
class Visitable {
    Accept(visitor, token, markdownDocument) {
        visitor.Visit(token, markdownDocument);
    }
}
class VisitorBase {
    constructor(tagType, TagTypeToHtml) {
        this.tagType = tagType;
        this.TagTypeToHtml = TagTypeToHtml;
    }
    Visit(token, markdownDocument) {
        markdownDocument.Add(this.TagTypeToHtml.OpeningTag(this.tagType), token.CurrentLine, this.TagTypeToHtml.ClosingTag(this.tagType));
    }
}
//#endregion Visitor pattern base
//#region Chain of responsibility implementation
class Handler {
    constructor() {
        this.next = null;
    }
    SetNext(next) {
        this.next = next;
    }
    HandleRequest(request) {
        if (!this.CanHandle(request)) {
            if (this.next != null) {
                this.next.HandleRequest(request);
            }
            return;
        }
    }
}
class ParseChainHandler extends Handler {
    constructor(document, tagType, visitor) {
        super();
        this.document = document;
        this.tagType = tagType;
        this.visitor = visitor;
        this.visitable = new Visitable();
    }
    CanHandle(request) {
        let split = new LineParser().Parse(request.CurrentLine, this.tagType);
        if (split[0]) {
            request.CurrentLine = split[1];
            this.visitable.Accept(this.visitor, request, this.document);
        }
        return split[0];
    }
}
//#endregion Chain of responsibility implementation
//#region Concrete visitor
class Header1Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header1, new TagTypeToHtml());
    }
}
class Header2Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header2, new TagTypeToHtml());
    }
}
class Header3Visitor extends VisitorBase {
    constructor() {
        super(TagType.Header3, new TagTypeToHtml());
    }
}
class ParagraphVisitor extends VisitorBase {
    constructor() {
        super(TagType.Paragraph, new TagTypeToHtml());
    }
}
class HorizontalRuleVisitor extends VisitorBase {
    constructor() {
        super(TagType.HorizontalRule, new TagTypeToHtml());
    }
}
//#endregion
//#region Concrete chain of responsibility
class Header1ChainHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "# ", new Header1Visitor());
    }
}
class Header2ChainHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "## ", new Header2Visitor());
    }
}
class Header3ChainHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "### ", new Header3Visitor());
    }
}
class HorizontalRuleHandler extends ParseChainHandler {
    constructor(document) {
        super(document, "---", new HorizontalRuleVisitor());
    }
}
class ParagraphHandler extends Handler {
    constructor(document) {
        super();
        this.document = document;
        this.visitable = new Visitable();
        this.visitor = new ParagraphVisitor();
    }
    CanHandle(request) {
        this.visitable.Accept(this.visitor, request, this.document);
        return true;
    }
}
//#endregion
class ChainOfResponsibilityFactory {
    Build(document) {
        let header1 = new Header1ChainHandler(document);
        let header2 = new Header2ChainHandler(document);
        let header3 = new Header3ChainHandler(document);
        let horizontalRule = new HorizontalRuleHandler(document);
        let paragraph = new ParagraphHandler(document);
        header1.SetNext(header2);
        header2.SetNext(header3);
        header3.SetNext(horizontalRule);
        horizontalRule.SetNext(paragraph);
        return header1;
    }
}
class Markdown {
    ToHtml(text) {
        let document = new MarkdownDocument();
        let header1 = new ChainOfResponsibilityFactory().Build(document);
        let lines = text.split(`\n`);
        for (let index = 0; index < lines.length; index++) {
            let parseElement = new ParseElement();
            parseElement.CurrentLine = lines[index];
            header1.HandleRequest(parseElement);
        }
        return document.Get();
    }
}
class HtmlHandler {
    constructor() {
        this.markdownChange = new Markdown;
    }
    TextChangeHandler(id, output) {
        let markdown = document.getElementById(id);
        let markdownOutput = document.getElementById(output);
        if (markdown !== null) {
            markdown.onkeyup = (e) => {
                this.RenderHtmlContent(markdown, markdownOutput);
            };
            window.onload = (e) => {
                this.RenderHtmlContent(markdown, markdownOutput);
            };
        }
    }
    RenderHtmlContent(markdown, markdownOutput) {
        if (markdown.value) {
            markdownOutput.innerHTML = this.markdownChange.ToHtml(markdown.value);
        }
        else
            markdownOutput.innerHTML = "<p></p>";
    }
}
