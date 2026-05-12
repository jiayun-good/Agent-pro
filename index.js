import ReactAgent from './agent/react_agent.js';
const agent = new ReactAgent();

for await (const chunk of agent.executeStream("用户ID为1002,生成2025年2月的使用报告")) {
  process.stdout.write(chunk);
}

// import {fetchExternalData} from "./agent/tools/agentTools.js";
// (async () => {
//   const res = await fetchExternalData.invoke(
//     JSON.stringify({ user_id: "1002", month: "2025-02" })
//   );
//   console.log("测试结果:", res);
// })();

// import { fetchExternalDataHandler } from "./agent/tools/agentTools.js";

// (async () => {
//   const res = await fetchExternalDataHandler({ user_id: "1002", month: "2025-02" });
//   console.log("测试结果:", res);
// })();