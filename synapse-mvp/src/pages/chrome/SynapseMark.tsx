export default function SynapseMark({
  size = 28,
  title,
  className,
}: {
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      className={['synapse-logo', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        className="synapse-logo-grey"
        d="M0 150.085c0-29.248 23.711-52.959 52.959-52.959h211.83c14.046 0 27.516 5.58 37.448 15.511 9.932 9.932 15.511 23.402 15.511 37.448v211.83c0 29.248-23.711 52.959-52.959 52.959H52.959C23.711 414.874 0 391.163 0 361.915z"
      />
      <path
        className="synapse-logo-accent"
        d="M36.44 336.106c-2.348-8.234 12.688-19.723 33.584-25.661 20.896-5.938 39.74-4.076 42.088 4.158 2.348 8.234-12.688 19.723-33.584 25.661-20.896 5.938-39.74 4.076-42.088-4.158z"
      />
      <path
        className="synapse-logo-accent"
        d="M182.047 336.106c-2.348-8.234 12.688-19.723 33.584-25.661 20.896-5.938 39.74-4.076 42.088 4.158 2.348 8.234-12.688 19.723-33.584 25.661-20.896 5.938-39.74 4.076-42.088-4.158z"
      />
      <path className="synapse-logo-accent" d="M99.11 183.533h13.261v136.322H99.11z" />
      <path className="synapse-logo-accent" d="M244.926 183.533h13.261v136.322h-13.261z" />
      <path className="synapse-logo-accent" d="M99.035 183.985v-23.001h159.136v23.001z" />
      <circle className="synapse-logo-grey" cx="478.315" cy="33.685" r="33.685" />
      <circle className="synapse-logo-grey" cx="478.315" cy="256" r="33.685" />
      <circle className="synapse-logo-grey" cx="478.315" cy="478.315" r="33.685" />
      <path
        className="synapse-logo-grey-stroke"
        d="M317.748 256h173.921"
      />
      <path
        className="synapse-logo-grey-stroke"
        d="M317.748 256c31.721 0 47.579-55.583 63.441-111.165C397.051 89.252 412.917 33.67 444.645 33.67"
      />
      <path
        className="synapse-logo-grey-stroke"
        d="M317.748 256c31.721 0 47.579 55.575 63.441 111.15 15.862 55.575 31.728 111.15 63.456 111.15"
      />
    </svg>
  );
}
