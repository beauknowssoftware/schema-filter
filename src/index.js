const {buildASTSchema, parse, printSchema, buildSchema, ObjectTypeDefinitionNode, DefinitionNode} = require('graphql')
const {visit} = require('graphql/language')
const {readFileSync} = require('fs')
const {transformSchema, FilterTypes} = require('graphql-tools')

// process.argv[2] is the path to the schema
// the remaining arguments are feature flags
const [,,schemaPath, ...featureFlags] = process.argv

function getRequiredFeatureName(node) {
  // find `requiresFeatures` directive
  if (!node.directives || node.directives.length === 0) return false
  const directive = node.directives.find(d => d.name.value === 'requiresFeature')
  if (!directive) return false

  // return the  `featureName` argument value
  const argument = directive.arguments.find(a => a.name.value === 'featureName')
  return argument.value.value
}

function isFeatureFlaggedOff(node) {
  const featureName = getRequiredFeatureName(node)
  return featureName && !featureFlags.includes(featureName)
}

// get the original string representation of the schema
const schemaString = readFileSync(schemaPath).toString()

// get an AST from the original schema
const originalAst = parse(schemaString)

// remove all the fields that do not have their feature flags set
const ast = visit(originalAst, {
  enter(node) {
    // only interested in field nodes
    if (node.kind != 'FieldDefinition') return

    // returning null signals to the traversal that the node should be deleted
    if (isFeatureFlaggedOff(node)) return null
  }
})

// get a list of all the types that do not have their fature flags set
const ignoredTypes = ast.definitions
    .filter(isFeatureFlaggedOff)
    .map(n => n.name.value)

const workingSchema = buildASTSchema(ast)
// remove the types that do not have their feature flags set
const newSchema = transformSchema(workingSchema, [
  new FilterTypes(type => !ignoredTypes.includes(type.name))
])

console.log(printSchema(newSchema))
