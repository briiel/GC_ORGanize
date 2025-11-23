import { trigger, transition, style, animate, query } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // Anchor enter/leave hosts but only animate transform + opacity (no layout properties)
    query(':enter, :leave', [
      style({
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        opacity: 0,
        transform: 'translateY(12px)'
      })
    ], { optional: true }),

    // Leave: short, slightly upwards + fade for snappy removal
    query(':leave', [
      animate('220ms cubic-bezier(0.2,0,0.2,1)', style({ opacity: 0, transform: 'translateY(-8px)' }))
    ], { optional: true }),

    // Enter: smooth transform + fade-in
    query(':enter', [
      animate('320ms cubic-bezier(0.2,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);
