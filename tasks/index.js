/**
 * 
 * exports 对象：
 *      在 Node.js 中，exports 是一个对象，用于定义模块的公共接口。通过 exports，您可以将模块中的函数、对象或变量导出，以便在其他文件中使用。
 * require("./deploy-fundme")：
 *      是 Node.js 中用于导入模块的函数。它会执行指定路径的模块文件，并返回 module.exports 的内容。
 *      在这个例子中，require("./deploy-fundme") 导入了 deploy-fundme.js 文件中导出的内容。
 * exports.deployContract：
 *      这行代码将 deploy-fundme.js 文件中导出的内容赋值给 exports 对象的 deployContract 属性。
 *      这样，deployContract 就成为了 tasks/index.js 模块的一个导出属性，其他模块可以通过 require('./tasks') 来访问 deployContract。
 * 
 * **这里仅仅只是为了引入deploy-fundme.js和interact-fundme.js文件，所以这里导出的是一个空对象**
 * 
 * 含义
 * 模块化导出：
 *      通过将 deploy-fundme.js 的导出内容赋值给 exports.deployContract，您可以在其他文件中通过 require('./tasks').deployContract 来访问和使用 deploy-fundme.js 中的功能。
 * 代码组织：
 *      这种方式有助于将代码组织得更清晰。每个文件负责不同的功能模块，tasks/index.js 作为一个集中导出点，统一管理和导出这些功能。
 * 便于维护：
 *      通过这种方式，您可以轻松地在项目中添加、删除或修改功能模块，而不需要在多个地方进行更改。
 * 总之，这种写法是 Node.js 中常见的模块化编程方式，旨在提高代码的可维护性和可重用性。
 */
exports.deployContract = require("./deploy-fundme");
exports.interactContract = require("./interact-fundme");
