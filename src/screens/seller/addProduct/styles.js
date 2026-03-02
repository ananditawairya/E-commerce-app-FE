import { StyleSheet } from 'react-native';

/**
 * Style definitions for the seller add-product screen.
 */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 20 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6E8EB', borderRadius: 14,
    padding: 14, fontSize: 15, marginBottom: 15, color: '#111827',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 10, marginBottom: 15 },
  helperText: { fontSize: 13, color: '#6B7280', marginBottom: 10, fontStyle: 'italic' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1D4ED8',
    marginLeft: 10,
    lineHeight: 18,
  },
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 10 },
  imageWrapper: { position: 'relative', width: 100, height: 100 },
  imagePreview: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F3F4F6' },
  removeImageButton: {
    position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
  },
  addImageButton: {
    width: 100, height: 100, borderWidth: 2, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addImageButtonSmall: {
    width: 100, height: 100, borderWidth: 1, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  addImageText: { color: '#2563EB', fontSize: 12, marginTop: 5 },
  variantCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#2563EB', borderWidth: 1, borderColor: '#E6E8EB' },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  variantTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  variantImageLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 8 },
  addVariantButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15,
    borderWidth: 1, borderColor: '#2563EB', borderRadius: 14, borderStyle: 'dashed', marginBottom: 20,
  },
  addVariantText: { color: '#2563EB', fontSize: 16, fontWeight: '600', marginLeft: 5 },
  submitButton: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 30 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default styles;
