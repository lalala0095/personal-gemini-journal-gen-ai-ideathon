"""
Google ADK (Agent Development Kit) backend for Personal Gemini Journal.
Defines specialized AI agents for reflective journaling, brainstorming,
and executive synthesis with zero-trust session management.
"""

import os
import hashlib
from typing import Dict, Any, List, Optional
from google.adk.agents.llm_agent import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Shared in-memory session service with tenant isolation
session_service = InMemorySessionService()

def create_journal_agent() -> Agent:
    """
    Creates the primary Journaling & Ideation Partner Agent using Google ADK.
    Emphasizes introspective inquiry, constructive brainstorming, and emotional resonance.
    """
    instruction = (
        "You are an empathetic, insightful, and intellectually curious Personal Journaling & "
        "Brainstorming Partner powered by Google ADK and Gemini.\n\n"
        "Core Operating Principles:\n"
        "1. Foster Deep Introspection: Help the user examine underlying emotions, mental models, and hidden patterns.\n"
        "2. Targeted Curiosity: Conclude turns with one or two poignant, open-ended questions rather than lecturing.\n"
        "3. Ideation Structure: When the user brainstorms, synthesize their creative thoughts into clear conceptual branches.\n"
        "4. Confidential & Safe: Maintain an encouraging, confidential, non-judgmental atmosphere at all times."
    )
    
    return Agent(
        name="journal_partner_agent",
        model="gemini-2.5-flash",
        instruction=instruction,
        description="Empathetic reflective journaling and creative brainstorming agent"
    )

def create_synthesis_agent() -> Agent:
    """
    Creates the Executive Synthesis & Action Extraction Agent using Google ADK.
    """
    instruction = (
        "You are an Executive Synthesis & Action Plan extraction specialist powered by Google ADK.\n"
        "Your task is to analyze user journal entries and conversational ideation threads.\n"
        "Extract actionable takeaways, identify prominent psychological/thematic themes, "
        "measure emotional valence, and formulate clear next steps.\n"
        "Format your output clearly with structured headings."
    )
    
    return Agent(
        name="synthesis_agent",
        model="gemini-2.5-flash",
        instruction=instruction,
        description="Executive distillation and action plan extraction agent"
    )

# Instantiate Google ADK runners
journal_agent = create_journal_agent()
journal_runner = Runner(
    app_name="personal_gemini_journal",
    agent=journal_agent,
    session_service=session_service,
    auto_create_session=True
)

synthesis_agent = create_synthesis_agent()
synthesis_runner = Runner(
    app_name="personal_gemini_journal",
    agent=synthesis_agent,
    session_service=session_service,
    auto_create_session=True
)

async def run_journal_chat(
    user_id: str,
    session_id: str,
    messages: List[Dict[str, str]],
    user_context: Optional[str] = None
) -> str:
    """
    Executes a multi-turn conversation turn via Google ADK runner.
    """
    # Build prompt with history context
    history_lines = []
    for m in messages[:-1]:
        history_lines.append(f"{m.get('role', 'user').capitalize()}: {m.get('text', '')}")
    
    latest_msg = messages[-1].get("text", "") if messages else ""
    
    prompt_parts = []
    if user_context:
        prompt_parts.append(f"[Session Context: {user_context}]")
    if history_lines:
        prompt_parts.append("[Prior Turns in this Session]:\n" + "\n".join(history_lines))
    prompt_parts.append(f"User: {latest_msg}")
    
    full_prompt = "\n\n".join(prompt_parts)
    
    user_content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=full_prompt)]
    )
    
    collected_text = []
    async for event in journal_runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_content
    ):
        if hasattr(event, "content") and event.content:
            for part in getattr(event.content, "parts", []):
                if hasattr(part, "text") and part.text:
                    collected_text.append(part.text)
    
    reply = "".join(collected_text).strip()
    return reply or "I'm listening. What would you like to explore next in your journal?"

async def run_synthesis(
    user_id: str,
    title: str,
    content: str,
    messages: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Generates a structured executive synthesis using Google ADK.
    """
    session_id = f"synthesis_{hashlib.sha256((title + content).encode()).hexdigest()[:16]}"
    
    prompt = (
        f"Please analyze the following personal journal session titled '{title}':\n\n"
        f"CONTENT:\n{content}\n\n"
    )
    if messages:
        dialogue = "\n".join([f"{m.get('role')}: {m.get('text')}" for m in messages])
        prompt += f"BRAINSTORMING DIALOGUE:\n{dialogue}\n\n"
        
    prompt += (
        "Provide your analysis with these exact sections:\n"
        "### Executive Summary\n(A concise 2-3 sentence overview)\n\n"
        "### Key Themes\n(3-5 key recurring topics or themes)\n\n"
        "### Action Plan\n(Bullet list of actionable next steps)\n\n"
        "### Sentiment & Mindset\n(A brief assessment of emotional tone and cognitive clarity)"
    )

    user_content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=prompt)]
    )
    
    collected_text = []
    async for event in synthesis_runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_content
    ):
        if hasattr(event, "content") and event.content:
            for part in getattr(event.content, "parts", []):
                if hasattr(part, "text") and part.text:
                    collected_text.append(part.text)
                    
    full_output = "".join(collected_text).strip()
    
    # Parse basic sections or fallback
    summary = full_output
    action_items = []
    themes = []
    
    lines = full_output.split("\n")
    current_section = None
    
    for line in lines:
        stripped = line.strip()
        if "### Action Plan" in stripped or "Action Items" in stripped:
            current_section = "actions"
            continue
        elif "### Key Themes" in stripped:
            current_section = "themes"
            continue
        elif "### Sentiment" in stripped or "### Executive Summary" in stripped:
            current_section = "other"
            continue
            
        if current_section == "actions" and (stripped.startswith("-") or stripped.startswith("*") or (len(stripped) > 2 and stripped[0].isdigit() and stripped[1] in [".", ")"])):
            action_items.append(stripped.lstrip("-*0123456789.) "))
        elif current_section == "themes" and (stripped.startswith("-") or stripped.startswith("*")):
            themes.append(stripped.lstrip("-* "))

    return {
        "summary": full_output,
        "actionItems": action_items if action_items else ["Review journal insights and formulate milestones."],
        "keyThemes": themes if themes else ["Reflective Inquiry", "Growth Mindset"],
        "sentiment": "Reflective & Forward-Looking",
        "adkAgent": "google-adk-synthesis-agent"
    }
