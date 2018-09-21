const compiler = require('vue-template-compiler');
const recast = require('recast');
const builder = recast.types.builders;

module.exports = function(source) {
    let vueComponent = compiler.parseComponent(source, { pad: 'line' });
    let output = source;
    if (vueComponent.script && vueComponent.script.content && vueComponent.script.content.trim()) {
        let scriptContent = vueComponent.script.content;
        let ast = recast.parse(scriptContent);
        ast.program.body.unshift(createNodeENVStatement());
        let result = recast.print(ast).code;
        output = replaceRange(output, vueComponent.script.start, vueComponent.script.end, result);
        vueComponent = compiler.parseComponent(output, { pad: 'line' });
    }
    if (vueComponent.template && vueComponent.template.content && vueComponent.template.content.trim()) {
        let templateContent = vueComponent.template.content;
        let result = templateContent.replace(/(?<=(\s|<):style=").*?(?="(\s|>))/g, literalScript => {
            let ast = recast.parse(literalScript);
            convertStyleTemplate(ast);
            return recast.print(ast).code;
        });
        output = replaceRange(output, vueComponent.template.start, vueComponent.template.end, result);
    }
    return output;
};

function replaceRange(str, start, end, content) {
    return str.substring(0, start) + content + str.substring(end);
}

function convertStyleTemplate(ast) {
    recast.visit(ast, {
        visitMemberExpression: function(path) {
            if (path.node.object.type === 'Identifier' && path.node.object.name === 'styles') {
                path.node.object.name = '_styles';
            }
            this.traverse(path);
        }
    });
}

function createNodeENVStatement() {
    return builder.expressionStatement(
        builder.assignmentExpression(
            '=',
            builder.memberExpression(
                builder.memberExpression(
                    builder.memberExpression(builder.identifier('weex'), builder.identifier('config')),
                    builder.identifier('env')
                ),
                builder.identifier('NODE_ENV'),
                false
            ),
            builder.literal(process.env.NODE_ENV)
        )
    );
}
