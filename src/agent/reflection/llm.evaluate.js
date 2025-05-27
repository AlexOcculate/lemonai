// 评估
const resolveEvaluatePrompt = async (requirement = '', result = '') => {
  const prompt = `Please act as a professional review expert, fully understand the user's requirements and expected results, compare and analyze the execution results, evaluate whether the execution results meet the user's requirements
1. If the execution result fully meets the expected result, return success
2. If the execution result cannot be directly delivered, return failure, and return feedback, missing content, and suggestions for optimization
3. If the execution result partially meets or fails to execute the key steps, return partial, and return suggestions for补充遗漏内容

=== Task Goal ===
${requirement}
=== END ===

=== Code Execution Result ===
${result}
=== END ===

=== Return Format === 
<evaluation>
<status>success/failure</status>
<comments>
// evaluation result
</comments>
</evaluation>

Start:`
  return prompt;
}

const call = require("@src/utils/llm");
const evaluate_model = 'assistant';
const evaluate = async (requirement, result, conversation_id) => {
  const prompt = await resolveEvaluatePrompt(requirement, result);
  console.log('\n === evaluation prompt ===\n', prompt);
  // process.exit(0);
  const content = await call(prompt, conversation_id, evaluate_model);
  return content;
}

module.exports = exports = evaluate;