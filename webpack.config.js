const path = require("path");

module.exports = {
  entry: "./src/extension.ts",
  target: "node",
  mode: "none", // Use 'production' for minification
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode",
    typescript: "commonjs typescript",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  // Add this ignoreWarnings configuration
  ignoreWarnings: [
    {
      module: /node_modules\/typescript\/lib\/typescript\.js$/,
      message: /Critical dependency: the request of a dependency is an expression/,
    },
  ],
  // Increase performance
  stats: {
    warningsFilter: [/Critical dependency: the request of a dependency is an expression/],
  },
};
