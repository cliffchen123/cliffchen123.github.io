function skinDetection(input,output,[Kr,Kg,Kb]) {
	skinPoint = []
	for(var i=0;i<imgH;i++){
		for(var j=0;j<imgW;j++){
			var k = (imgW*i+j)*4;
			R = input.data[k]*Kr;
			G = input.data[k+1]*Kg;
			B = input.data[k+2]*Kb;
			Cr = 0.5000*R - 0.4187*G - 0.0813*B + 128 ;
			if(Cr>=140 && Cr<=160){
				output.data[k] = 255;
				output.data[k+1] = 255;
				output.data[k+2] = 255;
				skinPoint.push([i,j])
			}
			else{
				output.data[k] = 0;
				output.data[k+1] = 0;
				output.data[k+2] = 0;				
			}

			output.data[k+3] = 255;
		}
	}
	return skinPoint
}

function whiteBalance(input){
	var Kr=1, Kg=1, Kb=1, gray_sum=0;
	for(var i=0;i<imgH;i++){
		for(var j=0;j<imgW;j++){
			var k = (imgW*i+j)*4;
			R = input.data[k];
			G = input.data[k+1];
			B = input.data[k+2];
			gray = (R+G+B)/3;
			gray_sum+=gray;
			Kr += R;
			Kg += G;
			Kb += B;
		}
	}
	Kr = gray_sum/Kr;
	Kg = gray_sum/Kg;
	Kb = gray_sum/Kb;
	return [Kr,Kg,Kb]
}

function findCenter(points, ybias) {
	var center=[0,0];
	for(var i=0;i<points.length;i++){
		center[0]+=points[i][0];
		center[1]+=points[i][1];
	}
	var movement = Math.floor(imgH*ybias)
	center = [Math.floor(center[0]/points.length)+movement,Math.floor(center[1]/points.length)];
	return center
}

function centerAround(input,center,wScale,hScale) {
	let dst = new cv.Mat();
	[x1,y1,x2,y2] = [center[1]+(-wScale*imgW/2), center[0]+(-hScale*imgH/4*3), wScale*imgW, hScale*imgH];
	if(x1<0) x1=0;
	if(y1<0) y1=0;
	if(x1+x2>=imgW) x2=imgW-1-x1;
	if(y1+y2>=imgH) y2=imgH-1-y1;
	cv.rectangle(input,new cv.Point(x1,y1), new cv.Point(x1+x2,y1+y2),new cv.Scalar(0, 0, 255, 255),3);
	let rect = new cv.Rect(x1,y1,x2,y2);
	dst = input.roi(rect).clone();

	return dst
}

function FindWaveFeature(input,center){
	var wave =[];
	var average=0;
	for(var i=0.1;i<=Math.PI;i+=0.05){
		var temp=[0,0];				
		for(var j=1;j!=0;j++){
			var xbias = Math.round(Math.cos(i)*j);
			var x = center[1]+xbias;
			var ybias = Math.round(Math.sin(i)*j);
			var y = center[0]-ybias;
			if(x>input.cols||x<0||y<0) break;
			var k = (input.cols*y+x)*4;
			if(input.data[k]==255){
				input.data[k+1]=0
				input.data[k+2]=0
				temp[0]=xbias;
				temp[1]=ybias;
			}
		}
		var dis = Math.sqrt(temp[0]*temp[0]+temp[1]*temp[1]);
		average+=dis;
		if(dis!=0) wave.push(dis);
	}
	average /= wave.length;
	return [wave,average]
}

function fingerCount(input, output){

	// Gray Word Assumption
	var Kr=1, Kg=1, Kb=1;
	// [Kr,Kg,Kb] = whiteBalance(input);

	// skin detection
	var skinPoint = skinDetection(input,output,[Kr,Kg,Kb]);

	// find skin center
	var center = findCenter(skinPoint,0.1)

	// find hand range
	wScale = 0.3;
	hScale = 0.6;
	handRange = centerAround(output,center,wScale,hScale)



	for(var i=-10;i<10;i++){
		for(var j=-10;j<10;j++){
			var k = (imgW*(center[0]+i)+center[1]+j)*4;
			output.data[k]=0;
			output.data[k+1]=255;
			output.data[k+2]=0;
		}
	}

	// create wave
	var wave,average;
	[wave,average] = FindWaveFeature(handRange,[hScale*imgH/4*3,wScale*imgW/2]);

	// compute mountain
	wave.splice(0,0,0);
	wave.push(0);
	var mountain = [];
	var cur;
	var last = wave[0];
	var left = wave[0];
	var right;
	var isUp = true;
	var maxHeight;
	for(var i=1;i<wave.length;i++){
		cur = wave[i];
		if(isUp==true && last>cur){
			isUp = false;
			maxHeight = last;
		}
		else if(isUp==false && (last<cur || i==wave.length-1)){
			isUp = true;
			right = last;
			mountain.push(Math.min(maxHeight-left,maxHeight-right));
			left = last;
		}
		last = wave[i];
	}
	
	// compute predict number
	var predict_number=0;
	for(var i=0;i<mountain.length;i++){
		if(mountain[i]>average/4){
			predict_number+=1;
		}
	}

	return [predict_number, wave, average, handRange]
}

async function fingerCountDNN(input,output){
	// Gray Word Assumption
	var Kr=1, Kg=1, Kb=1;
	// [Kr,Kg,Kb] = whiteBalance(input);

	// skin detection
	var skinPoint = skinDetection(input,output,[Kr,Kg,Kb]);
	

	// find skin center
	var center = findCenter(skinPoint,0.1)
	for(var i=-10;i<10;i++){
		for(var j=-10;j<10;j++){
			var k = (imgW*(center[0]+i)+center[1]+j)*4;
			output.data[k]=0;
			output.data[k+1]=0;
			output.data[k+2]=255;
		}
	}

	// create wave
	var waveLength = 0
	for(var i=0.1;i<=Math.PI;i+=0.05)waveLength+=1
	var wave,average;
	[wave,average] = FindWaveFeature(output,center);
	zerosNum = waveLength-wave.length;
	for(var i=0;i<zerosNum;i++){
		wave.push(0)
	}
	const model = await tf.loadLayersModel('https://cliffchen123.github.io/GestureRecognition/data/model-wave/model.json');
	probability = model.predict(tf.tensor2d([wave])).dataSync();
	predict_number = probability.indexOf(Math.max(...probability));
	return predict_number;
}

function removeBackground(input,rmBackgroundModel){
	var gray = cv.Mat.zeros(imgH,imgW,cv.CV_8UC1);
	cv.cvtColor(input,gray,cv.COLOR_RGBA2GRAY);
	var mask= cv.Mat.ones(imgH,imgW,cv.CV_8UC1);
	rmBackgroundModel.apply(gray,mask);
	cv.threshold(mask, mask, 0, 1, cv.THRESH_BINARY);
	moving = whiteBackground.clone();
	input.copyTo(moving,mask);
	mask.delete()
	gray.delete()
	return moving;
}

function faceMasking(input, faceModel){
	var gray = new cv.Mat();
	cv.cvtColor(input,gray,cv.COLOR_RGBA2GRAY);
	let faces = new cv.RectVector();
	let dst = new cv.Mat();
	input.copyTo(dst);
	faceModel.detectMultiScale(gray, faces, 1.1, 3, 0);
	// draw faces.
	for (let i = 0; i < faces.size(); ++i) {
		let face = faces.get(i);
		let point1 = new cv.Point(face.x, face.y);
		let point2 = new cv.Point(face.x + face.width, face.y + face.height*1.4);
		cv.rectangle(dst, point1, point2, [255, 255, 255, 255],-1);
	}

	gray.delete()
	faces.delete()

	return dst
}