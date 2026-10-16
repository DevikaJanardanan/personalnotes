const mongoose = require('mongoose');

const NOTE_COLORS = ['default', 'yellow', 'green', 'blue', 'pink', 'purple'];

const noteSchema = new mongoose.Schema(
  {
    // Owner of the note – every query filters by this field (data isolation)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    content: {
      type: String,
      default: '',
      maxlength: [20000, 'Content must be at most 20,000 characters'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'A note can have at most 10 tags',
      },
    },
    pinned: { type: Boolean, default: false },
    // Locked notes need the user's lock password to be opened
    locked: { type: Boolean, default: false },
    // Last time the *writing* changed (title, content, tags, colour).
    // Pinning / locking does not count as an edit.
    editedAt: { type: Date },
    color: { type: String, enum: NOTE_COLORS, default: 'default' },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Normalise tags: trimmed, lowercase, no '#', no duplicates, no empty strings
noteSchema.path('tags').set((tags) => {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [
    ...new Set(
      list
        .map((t) => String(t).trim().toLowerCase().replace(/^#+/, '').slice(0, 30))
        .filter(Boolean)
    ),
  ];
});

// A brand-new note counts as "written" at the moment it is created
noteSchema.pre('save', function setEditedAt() {
  if (this.isNew && !this.editedAt) this.editedAt = new Date();
});

// Compound indexes for the most common queries
noteSchema.index({ user: 1, pinned: -1, editedAt: -1 });
noteSchema.index({ user: 1, locked: 1 });
noteSchema.index({ user: 1, tags: 1 });

noteSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Note', noteSchema);
module.exports.NOTE_COLORS = NOTE_COLORS;
