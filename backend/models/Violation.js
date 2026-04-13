import mongoose from 'mongoose';

/**
 * Violation Schema
 * Records labour law compliance violations
 */
const violationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkLog',
    default: null
  },
  type: {
    type: String,
    enum: [
      'daily_hours_exceeded',      // > 9 hours per day
      'weekly_hours_exceeded',     // > 48 hours per week
      'break_requirement_violated' // > 5 hours continuous work without break
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['warning', 'violation'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    actualHours: Number,
    limitHours: Number,
    continuousMinutes: Number,
    weekStart: Date,
    weekEnd: Date
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
violationSchema.index({ user: 1, date: -1 });
violationSchema.index({ type: 1 });
violationSchema.index({ severity: 1 });
violationSchema.index({ acknowledged: 1 });

const Violation = mongoose.model('Violation', violationSchema);

export default Violation;
