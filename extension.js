const vscode = require('vscode');
const fs = require('fs');

function activate(context) {

	let output = vscode.window.createOutputChannel('L365 Refactoring')
	let disposable = vscode.commands.registerCommand('refactoring-tool-l365.action-tooltip', function () {

		output.clear();
		output.show();
		output.appendLine('Analizing workspace...');
		
		vscode.workspace.findFiles('**/*.al').then(files => {
			files.forEach(uri => {
				vscode.workspace.openTextDocument(uri).then(doc => {
					
					let modified = false;
					let docTxt = doc.getText()
					.replace(/\baction\b\s*\(\s*(("(("")|[^\"])*")|[_0-9a-zA-Z]\w*)\s*\)[\n\s]*{(([^}]*)\n*)*?}/gmi, fragment => {
						
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
					
					if (modified) fs.writeFileSync(uri.fsPath, docTxt);
				})
			});
		});
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
