import { StyleSheet } from 'react-native';
import theme from '../../../theme/theme';

/**
 * Style definitions for the seller add-product screen.
 */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 20 },
  input: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14,
    padding: 14, fontSize: 15, marginBottom: 15, color: theme.colors.textPrimary,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 10, marginBottom: 15 },
  helperText: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 10, fontStyle: 'italic' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.primary,
    marginLeft: 10,
    lineHeight: 18,
  },
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 10 },
  imageWrapper: { position: 'relative', width: 100, height: 100 },
  imagePreview: { width: 100, height: 100, borderRadius: 12, backgroundColor: theme.colors.surfaceMuted },
  removeImageButton: {
    position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  addImageButton: {
    width: 100, height: 100, borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addImageButtonSmall: {
    width: 100, height: 100, borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addImageText: { color: theme.colors.primary, fontSize: 12, marginTop: 5 },
  variantCard: { backgroundColor: theme.colors.surface, padding: 15, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.border },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  variantTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  variantImageLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 8 },
  addVariantButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15,
    borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 14, borderStyle: 'dashed', marginBottom: 20,
  },
  addVariantText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 5 },
  submitButton: { backgroundColor: theme.colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 30 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default styles;
