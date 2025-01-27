import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Status, StatusType, StepType } from '../core/types/steps';

@Component({
  selector: 'ion-steps',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],
})
export class IonStepsComponent implements OnInit, OnChanges {
  @Input() current = 1;
  @Input() steps: StepType[];
  @Input() disabled = false;
  @Input() clickable: boolean;
  @Output() indexChange = new EventEmitter<number>();

  public firstCatchStatus = true;

  FIRST_STEP = 1;

  stepStatus(step: StepType, currentIndex: number): StatusType {
    if (step.index < currentIndex) return Status.checked;
    if (step.index === currentIndex) return Status.selected;
    return Status.default;
  }

  checkStartedStatus(step: StepType, currentIndex: number): StatusType {
    return step.status ? step.status : this.stepStatus(step, currentIndex);
  }

  changeStep(currentIndex: number): void {
    if (currentIndex < 1 || currentIndex > this.steps.length) {
      return;
    }

    this.steps = this.steps.map((step) => {
      return {
        ...step,
        status: this.firstCatchStatus
          ? this.checkStartedStatus(step, currentIndex)
          : this.stepStatus(step, currentIndex),
      };
    });

    this.firstCatchStatus = false;
  }

  goesTo(index: number): void {
    if (this.clickable && !this.disabled) {
      this.indexChange.emit(index);
      this.changeStep(index);
    }
  }

  ngOnInit(): void {
    this.generateIndexesForStep();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.current && !changes.current.firstChange) {
      this.changeStep(changes.current.currentValue);
    }
  }

  private generateIndexesForStep(): void {
    this.steps.forEach((step, index) => {
      step.index = index + 1;
    });
    this.changeStep(this.current);
  }
}
