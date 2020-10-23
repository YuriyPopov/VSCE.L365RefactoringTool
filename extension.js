const vscode = require('vscode');
const fs = require('fs');

function processDocTxt(docTxt) {

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
			return ((modified) ? `${fragment}${((indent) ? indent[0] : '\t\t\t\t')}ToolTip = '${tooltip[0]}'; //TODO: Write tooltip` : fragment)
		});
	});

	return { txt: txt, modified: modified };
}


function activate(context) {

	let output = vscode.window.createOutputChannel('L365 Refactoring')

	context.subscriptions.push(vscode.commands.registerCommand('refactoring-tool-l365.set-action-tooltip-doc', function () {

		let editor = vscode.window.activeTextEditor;

		if (editor) {

			let selection = editor.selection;
			let text = ((selection.isEmpty) ? editor.document.getText() : editor.document.getText(selection).trim());
			let result = processDocTxt(text);

			if (result.modified) {
				editor.edit(editBuilder => {
					editBuilder.replace((((selection.isEmpty) ? new vscode.Range(editor.document.lineAt(0).range.start, editor.document.lineAt(editor.document.lineCount - 1).range.end) : selection)), result.txt);
				});
			}
		}

	}));

	context.subscriptions.push(vscode.commands.registerCommand('refactoring-tool-l365.set-action-tooltip-worksp', function () {

		output.clear();
		output.show();
		output.appendLine('Analizing workspace...');

		vscode.workspace.findFiles('**/*.al').then(files => {
			files.forEach(uri => {
				vscode.workspace.openTextDocument(uri).then(doc => {

					let result = processDocTxt(doc.getText());

					if (result.modified) fs.writeFileSync(uri.fsPath, result.txt);
				})
			});
		});
	}));
}

exports.activate = activate;

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
