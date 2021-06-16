precision highp float;
precision highp int;

out vec4 pc_FragColor;

in float z;

void main() {
	pc_FragColor.rgb = vec3(1., 0., 0.);
	pc_FragColor.a = 1.;
}