function fingerCount(input, output){

	// Gray Word Assumption
	var Kr=1, Kg=1, Kb=1, gray_sum=0;
	// for(var i=0;i<imgH;i++){
	// 	for(var j=0;j<imgW;j++){
	// 		var k = (imgW*i+j)*4;
	// 		R = input.data[k];
	// 		G = input.data[k+1];
	// 		B = input.data[k+2];
	// 		gray = (R+G+B)/3;
	// 		gray_sum+=gray;
	// 		Kr += R;
	// 		Kg += G;
	// 		Kb += B;
	// 	}
	// }
	// Kr = gray_sum/Kr;
	// Kg = gray_sum/Kg;
	// Kb = gray_sum/Kb;

	// skin detection
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

	// find skin center
	var center=[0,0];
	for(var i=0;i<skinPoint.length;i++){
		center[0]+=skinPoint[i][0];
		center[1]+=skinPoint[i][1];
	}
	var ybias = Math.floor(imgH/10)
	center = [Math.floor(center[0]/skinPoint.length)+ybias,Math.floor(center[1]/skinPoint.length)];
	for(var i=-10;i<10;i++){
		for(var j=-10;j<10;j++){
			var k = (imgW*(center[0]+i)+center[1]+j)*4;
			output.data[k]=0;
			output.data[k+1]=0;
			output.data[k+2]=255;
		}
	}

	// create wave
	var wave =[];
	var average=0;
	for(var i=0.1;i<=Math.PI;i+=0.05){
		var temp=[0,0];				
		for(var j=1;j!=0;j++){
			var xbias = Math.round(Math.cos(i)*j);
			var x = center[1]+xbias;
			var ybias = Math.round(Math.sin(i)*j);
			var y = center[0]-ybias;
			if(x>imgW||x<0||y<0) break;
			var k = (imgW*y+x)*4;
			if(output.data[k]==255){
				output.data[k+1]=0
				output.data[k+2]=0
				temp[0]=xbias;
				temp[1]=ybias;
			}
		}
		var dis = Math.sqrt(temp[0]*temp[0]+temp[1]*temp[1]);
		average+=dis;
		if(dis!=0) wave.push(dis);
	}

	// compute average and mountain
	average /= wave.length;
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

	return [predict_number, wave, average]
}

function removeBackground(input,rmBackgroundModel){
	var gray = cv.Mat.zeros(imgH,imgW,cv.CV_8UC1);
	cv.cvtColor(input,gray,cv.COLOR_BGR2GRAY);
	var mask= cv.Mat.ones(imgH,imgW,cv.CV_8UC1);
	rmBackgroundModel.apply(gray,mask);
	cv.threshold(mask, mask, 0, 1, cv.THRESH_BINARY);
	moving = whiteBackground.clone();
	input.copyTo(moving,mask);
	return moving;
}