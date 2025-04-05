import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useThemeColor } from './useThemeColor';

type TextStyles = {
  default: TextStyle;
  defaultSemiBold: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  link: TextStyle;
  wave: TextStyle;
  label: TextStyle;
  error: TextStyle;
  formLabel: TextStyle;
  formTitle: TextStyle;
  buttonText: TextStyle;
  modalTitle: TextStyle;
  modalOptionText: TextStyle;
  timePickerLabel: TextStyle;
  timePickerOptionText: TextStyle;
  datePickerTitle: TextStyle;
  datePickerBackButtonText: TextStyle;
  confirmButtonText: TextStyle;
  nextButtonText: TextStyle;
  recordingInfo: TextStyle;
  recordingText: TextStyle;
};

type ViewStyles = {
  container: ViewStyle;
  card: ViewStyle;
  collapsible: ViewStyle;
  collapsibleContent: ViewStyle;
  parallaxContainer: ViewStyle;
  parallaxHeader: ViewStyle;
  parallaxContent: ViewStyle;
  authInputContainer: ViewStyle;
  formGroup: ViewStyle;
  formContainer: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  title: ViewStyle;
  content: ViewStyle;
  input: ViewStyle;
  textArea: ViewStyle;
  optionsContainer: ViewStyle;
  optionButton: ViewStyle;
  dateButton: ViewStyle;
  switchContainer: ViewStyle;
  journalsContainer: ViewStyle;
  journalButton: ViewStyle;
  submitButton: ViewStyle;
  selectButton: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalOptions: ViewStyle;
  modalOption: ViewStyle;
  datePickerContainer: ViewStyle;
  datePickerHeader: ViewStyle;
  calendarGrid: ViewStyle;
  calendarDayHeader: ViewStyle;
  calendarDay: ViewStyle;
  calendarDayText: ViewStyle;
  metadataField: ViewStyle;
  metadataLabel: ViewStyle;
  datePickerControls: ViewStyle;
  timePickerContainer: ViewStyle;
  timePickerTitle: ViewStyle;
  timePickerControls: ViewStyle;
  timePickerColumn: ViewStyle;
  timePickerScroll: ViewStyle;
  timePickerOption: ViewStyle;
  timePickerActions: ViewStyle;
  datePickerBackButton: ViewStyle;
  confirmButton: ViewStyle;
  nextButton: ViewStyle;
  mediaContainer: ViewStyle;
  mediaOptions: ViewStyle;
  mediaOption: ViewStyle;
  mediaPreview: ViewStyle;
  imagePreview: ViewStyle;
  audioPreview: ViewStyle;
  audioPreviewText: ViewStyle;
  videoPreview: ViewStyle;
  videoPreviewText: ViewStyle;
  removeMediaButton: ViewStyle;
  cameraContainer: ViewStyle;
  camera: ViewStyle;
  cameraControls: ViewStyle;
  closeButton: ViewStyle;
  captureButton: ViewStyle;
};

type InputStyles = {
  default: TextStyle;
};

type LayoutStyles = {
  row: ViewStyle;
  column: ViewStyle;
  center: ViewStyle;
  spaceBetween: ViewStyle;
  collapsibleHeading: ViewStyle;
};

type SpacingStyles = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

type AppStyles = {
  text: TextStyles;
  view: ViewStyles;
  input: InputStyles;
  layout: LayoutStyles;
  spacing: SpacingStyles;
};

export const useStyles = (): AppStyles => {
  const textColor = useThemeColor({}, 'text');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');
  const backgroundAltColor = useThemeColor({}, 'backgroundAlt');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const borderColor = useThemeColor({}, 'border');

  return {
    text: {
      default: {
        fontSize: 16,
        lineHeight: 24,
        color: textColor,
      },
      defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600',
        color: textColor,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 32,
        color: textColor,
      },
      subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: textSecondaryColor,
      },
      link: {
        lineHeight: 30,
        fontSize: 16,
        color: primaryColor,
      },
      wave: {
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
        color: textColor,
      },
      label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
        color: textColor,
      },
      error: {
        fontSize: 14,
        marginTop: 4,
        color: errorColor,
      },
      formLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: textColor,
      },
      formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: textColor,
      },
      buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: textColor,
      },
      modalOptionText: {
        fontSize: 16,
        marginLeft: 12,
        color: textColor,
      },
      timePickerLabel: {
        fontSize: 16,
        marginBottom: 8,
        color: textColor,
      },
      timePickerOptionText: {
        fontSize: 16,
        color: textColor,
      },
      datePickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: textColor,
      },
      datePickerBackButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: textColor,
      },
      confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
      },
      nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
      },
      recordingInfo: {
        marginTop: 8,
        fontSize: 12,
        fontStyle: 'italic',
        color: textSecondaryColor,
      },
      recordingText: {
        color: '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 4,
      },
    },
    view: {
      container: {
        backgroundColor,
        flex: 1,
      },
      card: {
        backgroundColor: backgroundAltColor,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
      collapsible: {
        backgroundColor: backgroundAltColor,
        padding: 16,
        borderRadius: 12,
      },
      collapsibleContent: {
        marginTop: 6,
        marginLeft: 24,
      },
      parallaxContainer: {
        flex: 1,
        backgroundColor,
      },
      parallaxHeader: {
        height: 250,
        overflow: 'hidden',
        backgroundColor: backgroundAltColor,
      },
      parallaxContent: {
        flex: 1,
        padding: 32,
        gap: 16,
        overflow: 'hidden',
        backgroundColor,
      },
      authInputContainer: {
        marginBottom: 16,
      },
      formGroup: {
        marginBottom: 20,
      },
      formContainer: {
        flex: 1,
        padding: 20,
        backgroundColor,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        backgroundColor: backgroundAltColor,
      },
      backButton: {
        marginRight: 16,
      },
      title: {
        flex: 1,
      },
      content: {
        flex: 1,
        padding: 20,
        backgroundColor,
      },
      input: {
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: borderColor,
        backgroundColor: backgroundAltColor,
      },
      textArea: {
        height: 100,
      },
      optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
      },
      optionButton: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: borderColor,
        backgroundColor: backgroundAltColor,
      },
      dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        backgroundColor: backgroundAltColor,
      },
      switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      journalsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
      },
      journalButton: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: borderColor,
        backgroundColor: backgroundAltColor,
      },
      submitButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        backgroundColor: primaryColor,
      },
      selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: borderColor,
        backgroundColor: backgroundAltColor,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      },
      modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
        backgroundColor: backgroundAltColor,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      },
      modalOptions: {
        maxHeight: '80%',
      },
      modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: borderColor,
        backgroundColor: backgroundAltColor,
      },
      datePickerContainer: {
        padding: 20,
        backgroundColor: backgroundAltColor,
      },
      datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      },
      calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      calendarDayHeader: {
        width: '14.28%',
        marginBottom: 8,
      },
      calendarDay: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: backgroundAltColor,
      },
      calendarDayText: {
        fontSize: 16,
        color: textColor,
        textAlign: 'center',
      },
      metadataField: {
        marginBottom: 16,
      },
      metadataLabel: {
        marginBottom: 8,
      },
      datePickerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
      },
      timePickerContainer: {
        padding: 20,
        backgroundColor: backgroundAltColor,
      },
      timePickerTitle: {
        marginBottom: 16,
      },
      timePickerControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      timePickerColumn: {
        flex: 1,
        alignItems: 'center',
      },
      timePickerScroll: {
        height: 200,
      },
      timePickerOption: {
        padding: 12,
        borderRadius: 8,
        marginVertical: 4,
        width: '100%',
        alignItems: 'center',
        backgroundColor: backgroundAltColor,
      },
      timePickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
      },
      datePickerBackButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
        backgroundColor: secondaryColor,
      },
      confirmButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
        backgroundColor: primaryColor,
      },
      nextButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: primaryColor,
      },
      mediaContainer: {
        marginTop: 8,
      },
      mediaOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
      },
      mediaOption: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        width: '45%',
        backgroundColor: backgroundAltColor,
      },
      mediaPreview: {
        position: 'relative',
        alignItems: 'center',
      },
      imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
      },
      audioPreview: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: backgroundAltColor,
      },
      audioPreviewText: {
        marginLeft: 8,
      },
      videoPreview: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: backgroundAltColor,
      },
      videoPreviewText: {
        marginLeft: 8,
      },
      removeMediaButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: backgroundAltColor,
        borderRadius: 12,
      },
      cameraContainer: {
        flex: 1,
      },
      camera: {
        flex: 1,
      },
      cameraControls: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingBottom: 20,
      },
      closeButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
      },
      captureButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
      },
    },
    input: {
      default: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        borderColor: borderColor,
        color: textColor,
        backgroundColor: backgroundAltColor,
      },
    },
    layout: {
      row: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      column: {
        flexDirection: 'column',
      },
      center: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      spaceBetween: {
        justifyContent: 'space-between',
      },
      collapsibleHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  };
}; 