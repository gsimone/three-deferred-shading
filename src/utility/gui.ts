import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useControls } from 'leva';

function App<T>({ object }: { object: T }) {
	const data = useControls({ radius: 0.2, bias: 0.25, kernelSize: { value: 64, options: [8, 16, 32, 64, 128] } });

	React.useEffect(() => {

		// @ts-ignore
		object.uniforms.kernelSize.value = data.kernelSize
		// @ts-ignore
		object.uniforms.radius.value = data.radius

		// @ts-ignore
		object.uniforms.bias.value = data.bias/10

		
	}, [data])
	
	return null;
}

export function createLeva<T>(object: T) {

	console.log('yo')
  
	ReactDOM.render(
		React.createElement(App, {
			object,
		}),
		document.getElementById('react-root')
	);
  
}
