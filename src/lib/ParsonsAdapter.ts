import { ParsonsSettings, ParsonsGrader, ParsonsOptions } from '@/@types/types';

/**
 * Adapter class to bridge between the ParsonsUI library and modern browser/React environments
 */
export class ParsonsAdapter {
  private container: HTMLElement | null = null;
  private settings: ParsonsSettings;
  private initialized: boolean = false;
  
  constructor(containerId: string, settings: ParsonsSettings) {
    // Don't access document directly during server-side rendering
    this.settings = settings;
    this.containerId = containerId;
  }
  
  private containerId: string;
  
  /**
   * Initialize the Parsons puzzle with the current settings
   */
  initialize(): void {
    if (this.initialized) return;
    
    // Wait until we're in the browser before accessing document
    if (typeof window !== 'undefined') {
      this.container = document.getElementById(this.containerId) || document.body;
      
      // Create the necessary DOM structure
      this.createDomStructure();
      
      // Set initial code and options
      this.updateCode(this.settings.initial);
      this.updateOptions(this.settings.options);
      
      this.initialized = true;
    }
  }
  
  /**
   * Create the DOM structure required by the ParsonsUI library
   */
  private createDomStructure(): void {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = '';
    
    // Create the basic structure
    const structure = `
      <div class="ParsonsUI">
        <div class="code-blocks-container">
          <div class="code-blocks-ta-container fieldset">
            <label for="initial">Code to Become Blocks</label>
            <textarea id="initial" rows="7"></textarea>
          </div>
          <div class="contain-html-container fieldset">
            <input id="code-contain-html" type="checkbox" />
            <label for="code-contain-html" class="code-contain-html-label">Code blocks contain HTML?</label>
          </div>
        </div>
        
        <div class="distractor-blocks-container">
          <div class="distractor-blocks-ta-container fieldset">
            <label for="distractors">Code to Become Distractor Blocks</label>
            <textarea id="distractors" rows="6"></textarea>
          </div>
          <div class="distractor-blocks-max-container fieldset">
            <label for="max-distractors">Max Distractors</label>
            <input id="max-distractors" type="number" value="10" />
          </div>
        </div>
        
        <div class="common-settings-container">
          <div class="grader-container fieldset">
            <label for="grader">Grader</label>
            <select id="grader">
              <option value="ParsonsWidget._graders.LineBasedGrader">LineBasedGrader</option>
              <option value="ParsonsWidget._graders.VariableCheckGrader">VariableCheckGrader</option>
              <option value="ParsonsWidget._graders.UnitTestGrader">UnitTestGrader</option>
              <option value="ParsonsWidget._graders.LanguageTranslationGrader">LanguageTranslationGrader</option>
              <option value="ParsonsWidget._graders.TurtleGrader">TurtleGrader</option>
            </select>
          </div>
          <div class="show-feedback-container fieldset">
            <label for="show-feedback">Show feedback</label>
            <input id="show-feedback" type="checkbox" checked />
          </div>
          <div class="dragging-container fieldset">
            <label for="require-dragging">Require dragging?</label>
            <input id="require-dragging" type="checkbox" />
          </div>
          <div class="indenting-container fieldset">
            <label for="disable-indent">Disable indentation?</label>
            <input id="disable-indent" type="checkbox" />
          </div>
          <div class="indent-size-container fieldset">
            <label for="indent-size">Indent Size(px)</label>
            <input id="indent-size" type="text" value="50" />
          </div>
          <div class="exec-limit-container fieldset">
            <label for="exec-limit">Exec Limit(ms)</label>
            <input id="exec-limit" type="text" value="2500" />
          </div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = structure;
  }
  
  /**
   * Update the initial code in the editor
   */
  updateCode(codeString: string): void {
    if (!this.container) return;
    
    // Split code into regular blocks and distractors
    const lines = codeString.split('\n');
    const codeBlocks: string[] = [];
    const distractors: string[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      if (line.includes('#distractor')) {
        distractors.push(line.replace(/#distractor\s*$/, ''));
      } else {
        codeBlocks.push(line);
      }
    }
    
    // Update the textareas
    const initialTextarea = this.container.querySelector('#initial') as HTMLTextAreaElement;
    if (initialTextarea) {
      initialTextarea.value = codeBlocks.join('\n');
    }
    
    const distractorsTextarea = this.container.querySelector('#distractors') as HTMLTextAreaElement;
    if (distractorsTextarea) {
      distractorsTextarea.value = distractors.join('\n');
    }
  }
  
  /**
   * Update the Parsons options
   */
  updateOptions(options: ParsonsOptions): void {
    if (!this.container) return;
    
    // Set grader
    if (options.grader) {
      const graderValue = typeof options.grader === 'string' 
        ? options.grader 
        : options.grader.toString();
        
      const graderSelect = this.container.querySelector('#grader') as HTMLSelectElement;
      if (graderSelect) {
        // Try to find the matching option
        const options = Array.from(graderSelect.options);
        const option = options.find(opt => opt.value.includes(graderValue));
        if (option) {
          graderSelect.value = option.value;
        }
      }
    }
    
    // Set max distractors
    if (options.max_wrong_lines !== undefined) {
      const maxDistractors = this.container.querySelector('#max-distractors') as HTMLInputElement;
      if (maxDistractors) {
        maxDistractors.value = options.max_wrong_lines.toString();
      }
    }
    
    // Set indentation options
    if (options.can_indent !== undefined) {
      const disableIndent = this.container.querySelector('#disable-indent') as HTMLInputElement;
      if (disableIndent) {
        disableIndent.checked = !options.can_indent;
      }
    }
    
    if (options.x_indent !== undefined) {
      const indentSize = this.container.querySelector('#indent-size') as HTMLInputElement;
      if (indentSize) {
        indentSize.value = options.x_indent.toString();
      }
    }
    
    // Set execution limit
    if (options.exec_limit !== undefined) {
      const execLimit = this.container.querySelector('#exec-limit') as HTMLInputElement;
      if (execLimit) {
        execLimit.value = options.exec_limit.toString();
      }
    }
    
    // Set dragging requirement
    if (options.trashId) {
      const requireDragging = this.container.querySelector('#require-dragging') as HTMLInputElement;
      if (requireDragging) {
        requireDragging.checked = true;
      }
    }
    
    // Set feedback visibility
    if (options.show_feedback !== undefined) {
      const showFeedback = this.container.querySelector('#show-feedback') as HTMLInputElement;
      if (showFeedback) {
        showFeedback.checked = options.show_feedback;
      }
    }
  }
  
  /**
   * Get the current settings from the UI
   */
  getCurrentSettings(): ParsonsSettings {
    // In a real implementation, this would extract all the values from the form
    // For now, we'll just return the original settings
    return this.settings;
  }
  
  /**
   * Destroy the Parsons UI and clean up resources
   */
  destroy(): void {
    if (!this.initialized || !this.container) return;
    
    // Clean up DOM elements
    this.container.innerHTML = '';
    this.initialized = false;
  }
}

export default ParsonsAdapter;