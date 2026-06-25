import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { usePdfsStore } from '../store/pdfsStore';
import { WebView } from 'react-native-webview';

export default function PdfViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'PdfViewer'>>();
  const { pdfId } = route.params;

  const pdf = usePdfsStore(state => state.pdfs.find(p => p.id === pdfId));

  if (!pdf) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-stone-950 justify-center items-center">
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }
  console.log('\n=== PDF VIEWER DEBUG ===');
  console.log('1. Navigation Parameter (pdfId):', pdfId);
  console.log('2. Stored pdfUrl:', pdf.pdfUrl);

  // For iOS, the native WebKit engine handles PDFs beautifully natively.
  // For Android, external viewers like Google Docs or Mozilla are too restrictive and often fail.
  // So we inject our own PDF.js instance directly into the WebView via HTML.
  // This bypasses all CORS and viewer-origin locks since the JS runs locally!
  const pdfJsHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    body { background-color: #0c0a09; margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .pdf-page { margin-bottom: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.5); }
    #loading { color: #a8a29e; font-family: sans-serif; margin-top: 50px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div id="loading">Loading PDF...<br><small style="color:#78716c;margin-top:8px;display:block;">Downloading from secure vault</small></div>
  <div id="container" style="width: 100%; display: flex; flex-direction: column; align-items: center;"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var loadingTask = pdfjsLib.getDocument('${pdf.pdfUrl}');
    loadingTask.promise.then(function(pdf) {
      document.getElementById('loading').style.display = 'none';
      var container = document.getElementById('container');
      
      var currPage = 1;
      var numPages = pdf.numPages;
      
      function renderPage(pageNum) {
        pdf.getPage(pageNum).then(function(page) {
          var unscaledViewport = page.getViewport({scale: 1});
          // Fit width with 8px margin
          var scale = (window.innerWidth - 16) / unscaledViewport.width; 
          var viewport = page.getViewport({scale: scale});
          
          // Render at 2x resolution for sharpness (Retina quality)
          var renderScale = 2; 
          var renderViewport = page.getViewport({scale: scale * renderScale});
          
          var canvas = document.createElement('canvas');
          canvas.className = 'pdf-page';
          var ctx = canvas.getContext('2d');
          
          canvas.height = renderViewport.height;
          canvas.width = renderViewport.width;
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          
          container.appendChild(canvas);
          
          page.render({ canvasContext: ctx, viewport: renderViewport }).promise.then(function() {
            if (currPage < numPages) {
              currPage++;
              renderPage(currPage);
            }
          });
        });
      }
      
      renderPage(1);
    }).catch(function(err) {
      document.getElementById('loading').innerHTML = '<span style="color:#ef4444;font-weight:bold;">Failed to load PDF</span><br><br><span style="color:#a8a29e;font-size:12px;">' + err.message + '</span>';
    });
  </script>
</body>
</html>
  `;

  console.log('========================\n');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }} className="bg-stone-950">
      <View className="flex-row items-center justify-between p-4 bg-stone-950/80 absolute top-0 left-0 right-0 z-50">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-stone-800/80 items-center justify-center backdrop-blur-md"
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <WebView
        source={Platform.OS === 'ios' ? { uri: pdf.pdfUrl } : { html: pdfJsHtml }}
        style={{ flex: 1, backgroundColor: '#0c0a09', marginTop: 60 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="absolute inset-0 justify-center items-center bg-stone-950">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
