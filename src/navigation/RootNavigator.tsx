import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppNavigator from './AppNavigator';
import CreateNoteScreen from '../screens/CreateNote';
import CreateLinkScreen from '../screens/CreateLink';
import CollectionDetailsScreen from '../screens/CollectionDetails';
import CreateImageScreen from '../screens/CreateImage';
import ImageViewerScreen from '../screens/ImageViewer';
import CreatePdfScreen from '../screens/CreatePdf';
import PdfViewerScreen from '../screens/PdfViewer';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={AppNavigator} />
      <Stack.Screen 
        name="CreateNote" 
        component={CreateNoteScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="CreateLink" 
        component={CreateLinkScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="CollectionDetails" 
        component={CollectionDetailsScreen} 
      />
      <Stack.Screen 
        name="CreateImage" 
        component={CreateImageScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="ImageViewer" 
        component={ImageViewerScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="CreatePdf" 
        component={CreatePdfScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen 
        name="PdfViewer" 
        component={PdfViewerScreen} 
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
}
