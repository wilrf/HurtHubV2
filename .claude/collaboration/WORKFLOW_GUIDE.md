# Multi-Agent Collaboration Workflow Guide

## 🎯 Purpose
This system eliminates manual copy-paste between Claude Code sessions while maintaining the proven 3-agent review process for high-quality collaborative problem-solving.

## 🔧 Setup (One-Time)
1. The `.claude/collaboration/` folder contains:
   - `AGENT_COLLABORATION.md` - Main collaboration workspace
   - `WORKFLOW_GUIDE.md` - This guide
   - Session-specific files as needed

## 🚀 New Workflow Process

### Step 1: Lead Agent (Claude A) - Initial Analysis
1. **Open** `.claude/collaboration/AGENT_COLLABORATION.md`
2. **Fill in** the "Current Task" section with the problem/requirement
3. **Complete** the "Lead Agent Analysis" section with your detailed plan
4. **Save** the file
5. **Tell the user:** "I've documented my analysis in `.claude/collaboration/AGENT_COLLABORATION.md`. Please have Claude B and Cursor Agent review it."

### Step 2: Reviewing Agents (Claude B & Cursor)
**Instructions for each reviewing agent:**

1. **Read** `.claude/collaboration/AGENT_COLLABORATION.md` completely
2. **Add your review** in your designated section using the provided template
3. **Reference specific line numbers** when commenting on the lead agent's plan
4. **Save** the file after adding your review
5. **Tell the user:** "I've added my review to the collaboration file."

### Step 3: Lead Agent (Claude A) - Response to Reviews
1. **Re-read** the collaboration file to see all reviews
2. **Fill in** the "Lead Agent Response" section
3. **Address each concern** and answer questions raised
4. **Revise your approach** if needed based on feedback
5. **Save** the file

### Step 4: Final Consensus (If Needed)
- If major changes were made, reviewing agents can add follow-up reviews
- Continue until all agents mark "Ready for Implementation: Yes"

## 💡 Pro Tips

### For the Lead Agent (Claude A):
- Be thorough in your initial analysis to minimize revision rounds
- Clearly explain your reasoning for choices made
- Don't be defensive - reviews improve the final solution

### For Reviewing Agents (Claude B & Cursor):
- Focus on potential issues the lead agent might have missed
- Suggest specific improvements, not just criticism
- Consider alternative approaches
- Ask clarifying questions if anything is unclear

### For the User (Doug):
- Let each agent know which file to work with: `.claude/collaboration/AGENT_COLLABORATION.md`
- Monitor progress by checking the file after each agent works on it
- Only intervene if agents get stuck or need clarification

### For the Lead Agent (Providing Prompts):
**CRITICAL**: When providing prompts for other agents, always use this format to prevent loops:

```
## 📋 **Copy-Paste Ready Prompts**

**For Claude B:**
---
```
[Prompt text written from THEIR perspective, not yours]
```
---

**For Cursor Agent:**  
---
```
[Prompt text written from THEIR perspective, not yours]
```
---
```

**Never write prompts as if speaking to yourself** - this creates loops where the user accidentally sends your instructions back to you instead of to the other agents.

## 📊 Benefits Over Previous Method

| Old Method | New Method |
|------------|------------|
| Manual copy-paste between sessions | Direct file collaboration |
| Information can get lost/corrupted | Persistent, version-controlled |
| No structured format | Standardized review template |
| Hard to track progress | Clear status indicators |
| Difficult to reference specific points | Line numbers and structured sections |

## 🔄 Session Management

### For Multiple Sessions:
1. **Archive** completed collaborations: rename to `AGENT_COLLABORATION_[date]_[task].md`
2. **Start fresh** with a clean `AGENT_COLLABORATION.md` for new tasks
3. **Reference** previous sessions when relevant

### For Complex Projects:
- Create task-specific collaboration files: `AGENT_COLLABORATION_[feature-name].md`
- Use the main file for overall project planning
- Cross-reference between files as needed

## ⚠️ Important Notes

1. **One task per file** - Don't mix multiple unrelated tasks in one collaboration session
2. **Clear completion** - Mark "Ready for Implementation: Yes" only when truly ready
3. **Save frequently** - Each agent should save after adding their contribution
4. **Read completely** - Always read the entire file before adding your section

## 🎉 Quick Start Command

**For Doug:** Simply tell the lead agent: *"Please start a collaboration session for [task description] using the agent collaboration system."*

The lead agent will handle the rest!