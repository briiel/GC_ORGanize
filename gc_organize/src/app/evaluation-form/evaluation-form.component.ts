import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluationService } from '../services/evaluation.service';

@Component({
  selector: 'app-evaluation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './evaluation-form.component.html',
  styleUrls: ['./evaluation-form.component.css']
})
export class EvaluationFormComponent implements OnInit {
  evaluationForm!: FormGroup;
  eventId!: number;
  eventTitle: string = '';
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private evaluationService: EvaluationService
  ) {}

  ngOnInit() {
    // Get event ID from route
    this.eventId = Number(this.route.snapshot.paramMap.get('eventId'));
    this.eventTitle = this.route.snapshot.queryParamMap.get('title') || 'Event';

    // Check if already submitted
    this.checkEvaluationStatus();

    // Initialize form based on OSWS-SA Form 05
    this.evaluationForm = this.fb.group({
      // Rating questions 1-13 (NA, 1-5 scale)
      question1: [null, Validators.required],
      question2: [null, Validators.required],
      question3: [null, Validators.required],
      question4: [null, Validators.required],
      question5: [null, Validators.required],
      question6: [null, Validators.required],
      question7: [null, Validators.required],
      question8: [null, Validators.required],
      question9: [null, Validators.required],
      question10: [null, Validators.required],
      question11: [null, Validators.required],
      question12: [null, Validators.required],
      question13: [null, Validators.required],
      
      // Open-ended questions 14-16
      question14: ['', Validators.required],
      question15: ['', Validators.required],
      question16: ['']
    });
  }

  checkEvaluationStatus() {
    this.loading = true;
    this.evaluationService.getEvaluationStatus(this.eventId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.data.has_evaluated) {
          this.errorMessage = 'You have already submitted an evaluation for this event.';
          setTimeout(() => {
            this.router.navigate(['/sidebar/ecertificate']);
          }, 2000);
        }
        if (!response.data.has_attended) {
          this.errorMessage = 'You must attend the event before submitting an evaluation.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error checking evaluation status:', err);
      }
    });
  }

  onSubmit() {
    if (this.evaluationForm.invalid) {
      this.errorMessage = 'Please fill out all required fields.';
      Object.keys(this.evaluationForm.controls).forEach(key => {
        this.evaluationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.evaluationForm.value;
    
    // Structure the responses according to OSWS-SA Form 05
    const responses = {
      ratings: {
        question1: formValue.question1,
        question2: formValue.question2,
        question3: formValue.question3,
        question4: formValue.question4,
        question5: formValue.question5,
        question6: formValue.question6,
        question7: formValue.question7,
        question8: formValue.question8,
        question9: formValue.question9,
        question10: formValue.question10,
        question11: formValue.question11,
        question12: formValue.question12,
        question13: formValue.question13
      },
      comments: {
        question14: formValue.question14,
        question15: formValue.question15,
        question16: formValue.question16 || ''
      }
    };

    this.evaluationService.submitEvaluation(this.eventId, responses).subscribe({
      next: (response) => {
        this.submitting = false;
        this.successMessage = 'Evaluation submitted successfully! Your certificate is now ready. Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/sidebar/ecertificate']);
        }, 2500);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Failed to submit evaluation. Please try again.';
        console.error('Error submitting evaluation:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/sidebar/ecertificate']);
  }
}
