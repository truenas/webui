# $FreeBSD$

PORTNAME=	freenas-webui
PORTVERSION=	${PRODUCT_VERSION:C/\-.*//:C/\_.*//}
PORTREVISION=	${REVISION}

CATEGORIES=		freenas
VALID_CATEGORIES+=	freenas

MAINTAINER=	dev@ixsystems.com
COMMENT=	Angular Web User Interface for FreeNAS

EXTRACT_ONLY=

FETCH_DEPENDS=	yarn:www/yarn \
		git>0:devel/git \
		python2>0:lang/python2 \
    gmake:devel/gmake
BUILD_DEPENDS=	rsync>0:net/rsync \
		yarn:www/yarn \
		python2>0:lang/python2 \
    gmake:devel/gmake
RUN_DEPENDS=  gmake:devel/gmake

NO_BUILD=	yes
WRKSRC=		/usr/webui

MTIMEREV!=	stat -f %m /usr/webui

checksum:
	${ECHO_CMD} ${.TARGET} not needed because building direct

fetch:
	${MKDIR} ${WRKDIR}
	${ECHO} "export default { product:'${PRODUCT}' }" > ${WRKSRC}/src/app/helptext/product.ts
	${ECHO} "var product = '${PRODUCT}'" > ${WRKSRC}/src/assets/scripts/product.js
	(cd ${WRKSRC} && ${LOCALBASE}/bin/yarn install && ${LOCALBASE}/bin/yarn run build:prod:aot)

extract:
	:

do-install:
	mkdir -p ${STAGEDIR}${PREFIX}/www/webui/
	rsync -avl --exclude '.git' --exclude 'nas_ports' --exclude 'etc' --exclude 'sbin' ${WRKSRC}/dist/ ${STAGEDIR}${PREFIX}/www/webui/
	${ECHO} "${MTIMEREV}" > ${STAGEDIR}/${PREFIX}/www/webui/assets/buildtime
	(cd ${STAGEDIR}${PREFIX}/www/webui; ${FIND} . -type f \
		| ${SED} -e 's,^\./,,g' \
		| ${AWK} '{print length, $$0}' | ${SORT} -rn \
		| cut -d " " -f 2- \
		| ${AWK} '{print "www/webui/"$$0 }' >> ${TMPPLIST})

.include <bsd.port.mk>
