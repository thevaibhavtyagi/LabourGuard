import mongoose from 'mongoose';

/**
 * WorkLog Schema - Privacy-First Design
 * Only stores work timestamps - no location or surveillance data
 */
const workLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: [true, 'Check-in time is required']
  },
  checkOut: {
    type: Date,
    default: null
  },
  totalMinutes: {
    type: Number,
    default: 0
  },
  breaks: [{
    start: Date,
    end: Date,
    durationMinutes: Number
  }],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  }
}, {
  timestamps: true
});

// Calculate total minutes when checking out
workLogSchema.methods.calculateTotalMinutes = function() {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    let totalMinutes = Math.floor(diffMs / 60000);
    
    // Subtract break time
    const breakMinutes = this.breaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    totalMinutes -= breakMinutes;
    
    this.totalMinutes = Math.max(0, totalMinutes);
  }
  return this.totalMinutes;
};

// Indexes for efficient queries
workLogSchema.index({ user: 1, date: -1 });
workLogSchema.index({ user: 1, status: 1 });
workLogSchema.index({ date: 1 });

const WorkLog = mongoose.model('WorkLog', workLogSchema);

export default WorkLog;
