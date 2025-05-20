import { ParsonsSettings, ParsonsGrader, ParsonsOptions } from '@/@types/types';

class ParsonsUI {
  private container: Element | null = null;
  private initialized: boolean = false;
  private selectorId: string;

  constructor(selector: string, private readonly initialSettings: ParsonsSettings) {
    this.selectorId = selector;
  }

  /**
   * Initialize the UI - only call this on the client side
   */
  initialize(): void {
    if (typeof window === 'undefined') {
      console.warn('ParsonsUI.initialize() was called on the server, which is not supported.');
      return;
    }

    // Find the container element
    this.container = document.querySelector(this.selectorId);
    if (!this.container) {
      console.error(`Element with selector "${this.selectorId}" not found.`);
      return;
    }

    // Call render and bind events
    this.render();
    this.bindEvents();
    this.initialized = true;
  }

  /**
   * Render the UI
   */
  private render(): void {
    if (!this.container) return;
    
    // Create the basic structure
    this.container.innerHTML = `
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
              <option value="LineBasedGrader">LineBasedGrader</option>
              <option value="VariableCheckGrader">VariableCheckGrader</option>
              <option value="UnitTestGrader">UnitTestGrader</option>
              <option value="LanguageTranslationGrader">LanguageTranslationGrader</option>
              <option value="TurtleGrader">TurtleGrader</option>
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

    // Update with initial settings
    this.updateCode(this.initialSettings.initial);
    this.updateOptions(this.initialSettings.options);
  }

  /**
   * Bind events to the UI elements
   */
  private bindEvents(): void {
    if (!this.container) return;

    // Grader change
    const graderSelect = this.container.querySelector('#grader');
    if (graderSelect) {
      graderSelect.addEventListener('change', this.handleGraderChange.bind(this));
    }

    // Add test button
    const addTestButtons = this.container.querySelectorAll('#add-test');
    addTestButtons.forEach(button => {
      button.addEventListener('click', this.handleAddTest.bind(this));
    });

    // Disable indent change
    const disableIndentCheckbox = this.container.querySelector('#disable-indent');
    if (disableIndentCheckbox) {
      disableIndentCheckbox.addEventListener('change', this.handleDisableIndentChange.bind(this));
    }

    // Other event bindings would go here...
  }

  /**
   * Handler for grader change
   */
  private handleGraderChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const graderValue = select.value as ParsonsGrader;
    console.log(`Grader changed to: ${graderValue}`);
    
    // Here you would update the UI based on the selected grader
  }

  /**
   * Handler for add test button
   */
  private handleAddTest(event: Event): void {
    event.preventDefault();
    const button = event.target as HTMLElement;
    const graderContainer = button.closest('.grader-form-container');
    
    if (graderContainer) {
      const isVarTests = graderContainer.classList.contains('variable-check-grader-container');
      const testList = graderContainer.querySelector('.tests-list');
      
      if (testList) {
        // Create and append a new test container
        const testContainer = document.createElement('li');
        testContainer.className = 'test-container';
        testContainer.textContent = 'New test';
        testList.appendChild(testContainer);
      }
    }
  }

  /**
   * Handler for disable indent change
   */
  private handleDisableIndentChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const indentSizeInput = this.container?.querySelector('#indent-size') as HTMLInputElement;
    
    if (indentSizeInput) {
      indentSizeInput.disabled = checkbox.checked;
    }
  }

  /**
   * Update the code in the UI
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
   * Update the options in the UI
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
        // Find the closest matching option
        const optionElements = Array.from(graderSelect.options);
        const option = optionElements.find(opt => opt.value.includes(graderValue));
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
   * Export the current settings from the UI
   */
  export(): ParsonsSettings {
    if (!this.container) {
      return this.initialSettings;
    }
    
    try {
      // Get the code
      const initialTextarea = this.container.querySelector('#initial') as HTMLTextAreaElement;
      const distractorsTextarea = this.container.querySelector('#distractors') as HTMLTextAreaElement;
      
      let initial = '';
      if (initialTextarea && distractorsTextarea) {
        const codeBlocks = initialTextarea.value.split('\n');
        const distractors = distractorsTextarea.value.split('\n')
          .filter(line => line.trim())
          .map(line => `${line} #distractor`);
        
        initial = [...codeBlocks, ...distractors].join('\n');
      }
      
      // Get the options
      const options: ParsonsOptions = { ...this.initialSettings.options };
      
      // Update options based on UI values
      const graderSelect = this.container.querySelector('#grader') as HTMLSelectElement;
      if (graderSelect) {
        options.grader = graderSelect.value;
      }
      
      const maxDistractors = this.container.querySelector('#max-distractors') as HTMLInputElement;
      if (maxDistractors) {
        options.max_wrong_lines = parseInt(maxDistractors.value, 10);
      }
      
      const disableIndent = this.container.querySelector('#disable-indent') as HTMLInputElement;
      if (disableIndent) {
        options.can_indent = !disableIndent.checked;
      }
      
      const indentSize = this.container.querySelector('#indent-size') as HTMLInputElement;
      if (indentSize) {
        options.x_indent = parseInt(indentSize.value, 10);
      }
      
      const execLimit = this.container.querySelector('#exec-limit') as HTMLInputElement;
      if (execLimit) {
        options.exec_limit = parseInt(execLimit.value, 10);
      }
      
      const requireDragging = this.container.querySelector('#require-dragging') as HTMLInputElement;
      if (requireDragging) {
        options.trashId = requireDragging.checked ? 'sortableTrash' : undefined;
      }
      
      const showFeedback = this.container.querySelector('#show-feedback') as HTMLInputElement;
      if (showFeedback) {
        options.show_feedback = showFeedback.checked;
      }
      
      return {
        initial,
        options
      };
    } catch (error) {
      console.error('Error exporting settings:', error);
      return this.initialSettings;
    }
  }

  /**
   * Destroy the UI
   */
  destroy(): void {
    if (!this.container || !this.initialized) return;
    
    // Remove event listeners
    const graderSelect = this.container.querySelector('#grader');
    if (graderSelect) {
      graderSelect.removeEventListener('change', this.handleGraderChange);
    }
    
    const addTestButtons = this.container.querySelectorAll('#add-test');
    addTestButtons.forEach(button => {
      button.removeEventListener('click', this.handleAddTest);
    });
    
    const disableIndentCheckbox = this.container.querySelector('#disable-indent');
    if (disableIndentCheckbox) {
      disableIndentCheckbox.removeEventListener('change', this.handleDisableIndentChange);
    }
    
    // Clear the container
    this.container.innerHTML = '';
    this.initialized = false;
  }
}

export { ParsonsUI };
export default ParsonsUI;