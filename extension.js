const vscode = require('vscode');
const fs = require('fs');

function applyActionTooltip(docTxt) {

    let modified = false;

    let txt = docTxt.replace(/\baction\b\s*\(\s*(("(("")|[^\"])*")|[_0-9a-zA-Z]\w*)\s*\)[\n\s]*{(([^}]*)\n*)*?}/gmi, fragment => {

        let indent = fragment.match(/^\s*(?=AccessByPermission|ApplicationArea|Caption|CaptionML|Description|Ellipsis|Enabled|Gesture|Image|InFooterBar|ObsoleteReason|ObsoleteState|ObsoleteTag|Promoted|PromotedCategory|PromotedIsBig|PromotedOnly|RunObject|RunPageLink|RunPageMode|RunPageOnRec|RunPageView|Scope|ShortcutKey|ToolTip|ToolTipML|Visible)/mi);

        let captions = [fragment.match(/(?<=\baction\b\s*\(\s*)(("(("")|[^"])*")|[_0-9a-zA-Z]\w*)\s*/), fragment.match(/(?<=\bCaption\s*=\s*')[^']+/)];
        let tooltip = [''];

        captions.forEach((item) => {
            if (item) tooltip.unshift(item[0]);
        });

        return fragment.replace(/(?:[\s\n]*\b(?:AccessByPermission|ApplicationArea|Caption|CaptionML|Description|Ellipsis|Enabled|Gesture|Image|InFooterBar|ObsoleteReason|ObsoleteState|ObsoleteTag|Promoted|PromotedCategory|PromotedIsBig|PromotedOnly|RunObject|RunPageLink|RunPageMode|RunPageOnRec|RunPageView|Scope|ShortcutKey|ToolTip|ToolTipML|Visible)\b[^;]+;(?:\s*\/\/.*)?)+/mi, fragment => {
            modified = !fragment.match(/\bToolTip[^;]+;/gmi);
            return ((modified) ? `${fragment}${((indent) ? indent[0] : '\n\t\t\t\t')}ToolTip = '${tooltip[0]}'; //TODO: Write tooltip` : fragment)
        });
    });

    return { txt: txt, modified: modified };
}

function applyFieldTooltip(docTxt) {

    let modified = false;

    let txt = docTxt.replace(/\bfield\b\s*\((?:\s*(?:(?:"(?:(?:"")|[^"])*")|[_0-9a-zA-Z]\w*))\s*;(?:\s*(\w+\.)?(?:(?:"(?:(?:"")|[^"])*")|[_0-9a-zA-Z]\w*))\s*\)[\n\s]*\{(?:(?:[^}]*)\n*)*?\}/gmi, fragment => {

        let indent = fragment.match(/^\s*(?=(AccessByPermission|ApplicationArea|AssistEdit|AutoFormatExpression|AutoFormatType|BlankNumbers|BlankZero|Caption|CaptionClass|CaptionML|CharAllowed|ClosingDates|ColumnSpan|DateFormula|DecimalPlaces|Description|DrillDown|DrillDownPageId|Editable|Enabled|ExtendedDatatype|HideValue|Image|Importance|Lookup|LookupPageId|MaxValue|MinValue|MultiLine|NotBlank|Numeric|ObsoleteReason|ObsoleteState|ObsoleteTag|ODataEDMType|OptionCaption|OptionCaptionML|QuickEntry|RowSpan|ShowCaption|ShowMandatory|SignDisplacement|Style|StyleExpr|TableRelation|Title|ToolTip|ToolTipML|ValuesAllowed|Visible|Width)\s*=)/mi);

        let captions = [fragment.match(/(?<=\bfield\b\s*\()(?:\s*(?:(?:"(?:(?:"")|[^"])*")|[_0-9a-zA-Z]\w*))/), fragment.match(/(?<=\bCaption\s*=\s*')[^']+/)];
        let tooltip = [''];

        captions.forEach((item) => {
            if (item) tooltip.unshift(item[0]);
        });

        tooltip[0] = ((tooltip[0][0] === '"') && (tooltip[0][tooltip[0].length - 1] === '"') ? tooltip[0].substr(1, tooltip[0].length - 2) : tooltip[0]);

        return fragment.replace(/(?:[\s\n]*\b(?:AccessByPermission|ApplicationArea|AssistEdit|AutoFormatExpression|AutoFormatType|BlankNumbers|BlankZero|Caption|CaptionClass|CaptionML|CharAllowed|ClosingDates|ColumnSpan|DateFormula|DecimalPlaces|Description|DrillDown|DrillDownPageId|Editable|Enabled|ExtendedDatatype|HideValue|Image|Importance|Lookup|LookupPageId|MaxValue|MinValue|MultiLine|NotBlank|Numeric|ObsoleteReason|ObsoleteState|ObsoleteTag|ODataEDMType|OptionCaption|OptionCaptionML|QuickEntry|RowSpan|ShowCaption|ShowMandatory|SignDisplacement|Style|StyleExpr|TableRelation|Title|ToolTip|ToolTipML|ValuesAllowed|Visible|Width)\b\s*=[^;]+;(?:\s*\/\/.*)?)+/mi, fragment => {
            modified = !fragment.match(/\bToolTip[^;]+;/gmi);
            return ((modified) ? `${fragment}${((indent) ? indent[0] : '\n\t\t\t\t')}ToolTip = 'Specifies ${tooltip[0]}';` : fragment)
        });
    });

    return { txt: txt, modified: modified };
}

function processCurrDocument(replacer) {
    let editor = vscode.window.activeTextEditor;

    if (editor) {

        let selection = editor.selection;
        let text = ((selection.isEmpty) ? editor.document.getText() : editor.document.getText(selection).trim());
        let result = replacer(text);

        if (result.modified) {
            editor.edit(editBuilder => {
                editBuilder.replace((((selection.isEmpty) ? new vscode.Range(editor.document.lineAt(0).range.start, editor.document.lineAt(editor.document.lineCount - 1).range.end) : selection)), result.txt);
            });
        }
    }
}


function processCurrWorkspace(replacer) {

    vscode.workspace.findFiles('**/*.al').then(files => {
        files.forEach(uri => {
            vscode.workspace.openTextDocument(uri).then(doc => {

                let result = replacer(doc.getText());
                if (result.modified) fs.writeFileSync(uri.fsPath, result.txt);
            })
        });
    });
}

function activate(context) {

    // let output = vscode.window.createOutputChannel('L365 Refactoring')

    let disposable = vscode.commands.registerCommand('abakion-refactoring-tool.set-action-tooltip-doc', () => { processCurrDocument(applyActionTooltip); });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('abakion-refactoring-tool.set-action-tooltip-worksp', () => { processCurrWorkspace(applyActionTooltip); });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('abakion-refactoring-tool.set-field-tooltip-doc', () => { processCurrDocument(applyFieldTooltip); });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('abakion-refactoring-tool.set-field-tooltip-worksp', () => { processCurrWorkspace(applyFieldTooltip); });
    context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {}

module.exports = {
    activate,
    deactivate
}